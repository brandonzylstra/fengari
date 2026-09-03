"use strict";

const {
    LUA_TNIL,
    LUA_TTABLE,
    lua_close,
    lua_createtable,
    lua_getfield,
    lua_isboolean,
    lua_isnoneornil,
    lua_pop,
    lua_pushboolean,
    lua_pushfstring,
    lua_pushinteger,
    lua_pushliteral,
    lua_pushnil,
    lua_pushnumber,
    lua_pushstring,
    lua_setfield,
    lua_settop,
    lua_toboolean,
    lua_tointegerx
} = require('./lua.js');
const {
    luaL_Buffer,
    luaL_addchar,
    luaL_addstring,
    // luaL_argcheck,
    luaL_argerror,
    luaL_buffinit,
    luaL_checkinteger,
    luaL_checkoption,
    luaL_checkstring,
    luaL_checktype,
    luaL_error,
    luaL_execresult,
    luaL_fileresult,
    luaL_newlib,
    luaL_optinteger,
    luaL_optlstring,
    luaL_optstring,
    luaL_pushresult
} = require('./lauxlib.js');
const {
    luastring_eq,
    to_jsstring,
    to_luastring
} = require("./fengaricore.js");

/* options for ANSI C 89 (only 1-char options) */
// const L_STRFTIMEC89 = to_luastring("aAbBcdHIjmMpSUwWxXyYZ%");
// const LUA_STRFTIMEOPTIONS = L_STRFTIMEC89;

/* options for ISO C 99 and POSIX */
// const L_STRFTIMEC99 = to_luastring("aAbBcCdDeFgGhHIjmMnprRStTuUVwWxXyYzZ%||EcECExEXEyEYOdOeOHOIOmOMOSOuOUOVOwOWOy");  /* two-char options */
// const LUA_STRFTIMEOPTIONS = L_STRFTIMEC99;

/* options for Windows */
// const L_STRFTIMEWIN = to_luastring("aAbBcdHIjmMpSUwWxXyYzZ%||#c#x#d#H#I#j#m#M#S#U#w#W#y#Y");  /* two-char options */
// const LUA_STRFTIMEOPTIONS = L_STRFTIMEWIN;

/* options for our own strftime implementation
  - should be superset of C89 options for compat
  - missing from C99:
      - ISO 8601 week specifiers: gGV
      - > single char specifiers
  - beyond C99:
      - %k: TZ extension: space-padded 24-hour
      - %l: TZ extension: space-padded 12-hour
      - %P: GNU extension: lower-case am/pm
*/
const LUA_STRFTIMEOPTIONS = to_luastring("aAbBcCdDeFhHIjklmMnpPrRStTuUwWxXyYzZ%");


const setfield = function(L, key, value) {
    lua_pushinteger(L, value);
    lua_setfield(L, -2, to_luastring(key, true));
};

const setboolfield = function(L, key, value) {
    lua_pushboolean(L, value);
    lua_setfield(L, -2, to_luastring(key, true));
};

/* Broken-down time accessors. Every one of them reads either the UTC or the
   local field of 'time' according to 'utc', which is set by the '!' that may
   lead an 'os.date' format string. */
const get_sec   = function(time, utc) { return utc ? time.getUTCSeconds()  : time.getSeconds();  };
const get_min   = function(time, utc) { return utc ? time.getUTCMinutes()  : time.getMinutes();  };
const get_hour  = function(time, utc) { return utc ? time.getUTCHours()    : time.getHours();    };
const get_mday  = function(time, utc) { return utc ? time.getUTCDate()     : time.getDate();     };
const get_mon   = function(time, utc) { return utc ? time.getUTCMonth()    : time.getMonth();    };
const get_year  = function(time, utc) { return utc ? time.getUTCFullYear() : time.getFullYear(); };
const get_wday  = function(time, utc) { return utc ? time.getUTCDay()      : time.getDay();      };

/* Whole days from the epoch to a calendar date, counted in UTC so that a
   daylight saving change cannot make the difference a fraction of a day.
   'setUTCFullYear' rather than the Date constructor, as the latter reads a
   year of 0-99 as 1900-1999. */
const days_from_epoch = function(year, mon, mday) {
    let d = new Date(0);
    d.setUTCFullYear(year, mon, mday);
    return Math.round(d.getTime() / 86400000);
};

/* Day of the year counting 1 January as 0, as C's 'tm_yday' does. */
const get_yday = function(time, utc) {
    let year = get_year(time, utc);
    return days_from_epoch(year, get_mon(time, utc), get_mday(time, utc))
         - days_from_epoch(year, 0, 1);
};

/* Local time only: true when the offset from UTC differs from the larger of
   the two offsets this year, which is the standard-time one in either
   hemisphere. Zones without daylight saving have a single offset and so
   always answer false. */
const get_isdst = function(time) {
    let year = time.getFullYear();
    let jan = new Date(year, 0, 1).getTimezoneOffset();
    let jul = new Date(year, 6, 1).getTimezoneOffset();
    return time.getTimezoneOffset() < (jan > jul ? jan : jul);
};

const setallfields = function(L, time, utc) {
    setfield(L, "sec",   get_sec(time, utc));
    setfield(L, "min",   get_min(time, utc));
    setfield(L, "hour",  get_hour(time, utc));
    setfield(L, "day",   get_mday(time, utc));
    setfield(L, "month", get_mon(time, utc) + 1);
    setfield(L, "year",  get_year(time, utc));
    setfield(L, "wday",  get_wday(time, utc) + 1);
    setfield(L, "yday",  get_yday(time, utc) + 1);  /* Lua counts 1 January as 1 */
    setboolfield(L, "isdst", utc ? false : get_isdst(time));
};

const L_MAXDATEFIELD = (Number.MAX_SAFE_INTEGER / 2);

const getfield = function(L, key, d, delta) {
    let t = lua_getfield(L, -1, to_luastring(key, true));  /* get field and its type */
    let res = lua_tointegerx(L, -1);
    if (res === false) {  /* field is not an integer? */
        if (t !== LUA_TNIL)  /* some other value? */
            return luaL_error(L, to_luastring("field '%s' is not an integer"), key);
        else if (d < 0)  /* absent field; no default? */
            return luaL_error(L, to_luastring("field '%s' missing in date table"), key);
        res = d;
    }
    else {
        if (!(-L_MAXDATEFIELD <= res && res <= L_MAXDATEFIELD))
            return luaL_error(L, to_luastring("field '%s' is out-of-bound"), key);
        res -= delta;
    }
    lua_pop(L, 1);
    return res;
};


const locale = {
    days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday" ].map((s) => to_luastring(s)),
    shortDays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((s) => to_luastring(s)),
    months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((s) => to_luastring(s)),
    shortMonths: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((s) => to_luastring(s)),
    AM: to_luastring("AM"),
    PM: to_luastring("PM"),
    am: to_luastring("am"),
    pm: to_luastring("pm"),
    formats: {
        c: to_luastring("%a %b %e %H:%M:%S %Y"),
        D: to_luastring("%m/%d/%y"),
        F: to_luastring("%Y-%m-%d"),
        R: to_luastring("%H:%M"),
        r: to_luastring("%I:%M:%S %p"),
        T: to_luastring("%H:%M:%S"),
        X: to_luastring("%T"),
        x: to_luastring("%D")
    }
};

const week_number = function(date, utc, start_of_week) {
    // This works by shifting the weekday back by one day if we
    // are treating Monday as the first day of the week.
    let weekday = get_wday(date, utc);
    if (start_of_week === 'monday') {
        if (weekday === 0) // Sunday
            weekday = 6;
        else
            weekday--;
    }
    return Math.floor((get_yday(date, utc) + 7 - weekday) / 7);
};

const push_pad_2 = function(b, n, pad) {
    if (n < 10)
        luaL_addchar(b, pad);
    luaL_addstring(b, to_luastring(String(n)));
};

const UTC = to_luastring("UTC");

/* The abbreviated name of the local zone, "EST" rather than "Eastern Standard
   Time". Intl gives the abbreviation where one exists; the bracketed tail
   of a Date's string form is the fallback for hosts without Intl. */
const timezone_name = function(date) {
    if (typeof Intl !== "undefined" && Intl.DateTimeFormat) {
        let parts = new Intl.DateTimeFormat("en-US", {timeZoneName: "short"}).formatToParts(date);
        for (let j = 0; j < parts.length; j++) {
            if (parts[j].type === "timeZoneName")
                return to_luastring(parts[j].value);
        }
    }
    let m = date.toString().match(/\(([\w\s]+)\)/);
    return m ? to_luastring(m[1]) : null;
};

const strftime = function(L, b, s, date, utc) {
    let i = 0;
    while (i < s.length) {
        if (s[i] !== 37 /* % */) {  /* not a conversion specifier? */
            luaL_addchar(b, s[i++]);
        } else {
            i++;  /* skip '%' */
            let len = checkoption(L, s, i);
            /* each `case` has an example output above it for the UTC epoch */
            switch(s[i]) {
                // '%'
                case 37 /* % */:
                    luaL_addchar(b, 37);
                    break;

                // 'Thursday'
                case 65 /* A */:
                    luaL_addstring(b, locale.days[get_wday(date, utc)]);
                    break;

                // 'January'
                case 66 /* B */:
                    luaL_addstring(b, locale.months[get_mon(date, utc)]);
                    break;

                // '19'
                case 67 /* C */:
                    push_pad_2(b, Math.floor(get_year(date, utc) / 100), 48 /* 0 */);
                    break;

                // '01/01/70'
                case 68 /* D */:
                    strftime(L, b, locale.formats.D, date, utc);
                    break;

                // '1970-01-01'
                case 70 /* F */:
                    strftime(L, b, locale.formats.F, date, utc);
                    break;

                // '00'
                case 72 /* H */:
                    push_pad_2(b, get_hour(date, utc), 48 /* 0 */);
                    break;

                // '12'
                case 73 /* I */:
                    push_pad_2(b, (get_hour(date, utc) + 11) % 12 + 1, 48 /* 0 */);
                    break;

                // '00'
                case 77 /* M */:
                    push_pad_2(b, get_min(date, utc), 48 /* 0 */);
                    break;

                // 'am'
                case 80 /* P */:
                    luaL_addstring(b, get_hour(date, utc) < 12 ? locale.am : locale.pm);
                    break;

                // '00:00'
                case 82 /* R */:
                    strftime(L, b, locale.formats.R, date, utc);
                    break;

                // '00'
                case 83 /* S */:
                    push_pad_2(b, get_sec(date, utc), 48 /* 0 */);
                    break;

                // '00:00:00'
                case 84 /* T */:
                    strftime(L, b, locale.formats.T, date, utc);
                    break;

                // '00'
                case 85 /* U */:
                    push_pad_2(b, week_number(date, utc, "sunday"), 48 /* 0 */);
                    break;

                // '00'
                case 87 /* W */:
                    push_pad_2(b, week_number(date, utc, "monday"), 48 /* 0 */);
                    break;

                // '16:00:00'
                case 88 /* X */:
                    strftime(L, b, locale.formats.X, date, utc);
                    break;

                // '1970'
                case 89 /* Y */:
                    luaL_addstring(b, to_luastring(String(get_year(date, utc))));
                    break;

                // 'UTC'
                case 90 /* Z */: {
                    let tzString = utc ? UTC : timezone_name(date);
                    if (tzString)
                        luaL_addstring(b, tzString);
                    break;
                }

                // 'Thu'
                case 97 /* a */:
                    luaL_addstring(b, locale.shortDays[get_wday(date, utc)]);
                    break;

                // 'Jan'
                case 98 /* b */:
                case 104 /* h */:
                    luaL_addstring(b, locale.shortMonths[get_mon(date, utc)]);
                    break;

                // ''
                case 99 /* c */:
                    strftime(L, b, locale.formats.c, date, utc);
                    break;

                // '01'
                case 100 /* d */:
                    push_pad_2(b, get_mday(date, utc), 48 /* 0 */);
                    break;

                // ' 1'
                case 101 /* e */:
                    push_pad_2(b, get_mday(date, utc), 32 /* space */);
                    break;

                // '001'
                case 106 /* j */: {
                    let yday = get_yday(date, utc) + 1;  /* '%j' counts 1 January as 1 */
                    if (yday < 100) {
                        if (yday < 10)
                            luaL_addchar(b, 48 /* 0 */);
                        luaL_addchar(b, 48 /* 0 */);
                    }
                    luaL_addstring(b, to_luastring(String(yday)));
                    break;
                }

                // ' 0'
                case 107 /* k */:
                    push_pad_2(b, get_hour(date, utc), 32 /* space */);
                    break;

                // '12'
                case 108 /* l */:
                    push_pad_2(b, (get_hour(date, utc) + 11) % 12 + 1, 32 /* space */);
                    break;

                // '01'
                case 109 /* m */:
                    push_pad_2(b, get_mon(date, utc) + 1, 48 /* 0 */);
                    break;

                // '\n'
                case 110 /* n */:
                    luaL_addchar(b, 10);
                    break;

                // 'AM'
                case 112 /* p */:
                    luaL_addstring(b, get_hour(date, utc) < 12 ? locale.AM : locale.PM);
                    break;

                // '12:00:00 AM'
                case 114 /* r */:
                    strftime(L, b, locale.formats.r, date, utc);
                    break;

                // '0'
                case 115 /* s */:
                    luaL_addstring(b, to_luastring(String(Math.floor(date / 1000))));
                    break;

                // '\t'
                case 116 /* t */:
                    luaL_addchar(b, 9);
                    break;

                // '4'
                case 117 /* u */: {
                    let day = get_wday(date, utc);
                    luaL_addstring(b, to_luastring(String(day === 0 ? 7 : day)));
                    break;
                }

                // '4'
                case 119 /* w */:
                    luaL_addstring(b, to_luastring(String(get_wday(date, utc))));
                    break;

                // '12/31/69'
                case 120 /* x */:
                    strftime(L, b, locale.formats.x, date, utc);
                    break;

                // '70'
                case 121 /* y */:
                    push_pad_2(b, get_year(date, utc) % 100, 48 /* 0 */);
                    break;

                // '+0000'
                case 122 /* z */: {
                    let off = utc ? 0 : date.getTimezoneOffset();
                    if (off > 0) {
                        luaL_addchar(b, 45 /* - */);
                    } else {
                        off = -off;
                        luaL_addchar(b, 43 /* + */);
                    }
                    push_pad_2(b, Math.floor(off/60), 48 /* 0 */);
                    push_pad_2(b, off % 60, 48 /* 0 */);
                    break;
                }
            }
            i += len;
        }
    }
};


const checkoption = function(L, conv, i) {
    let option = LUA_STRFTIMEOPTIONS;
    let o = 0;
    let oplen = 1;  /* length of options being checked */
    for (; o < option.length && oplen <= (conv.length - i); o += oplen) {
        if (option[o] === '|'.charCodeAt(0))  /* next block? */
            oplen++;  /* will check options with next length (+1) */
        else if (luastring_eq(conv.subarray(i, i+oplen), option.subarray(o, o+oplen))) {  /* match? */
            return oplen;  /* return length */
        }
    }
    luaL_argerror(L, 1,
        lua_pushfstring(L, to_luastring("invalid conversion specifier '%%%s'"), conv.subarray(i)));
};

/* maximum size for an individual 'strftime' item */
// const SIZETIMEFMT = 250;


const os_date = function(L) {
    let s = luaL_optlstring(L, 1, "%c");
    let stm = lua_isnoneornil(L, 2) ? new Date() : new Date(l_checktime(L, 2) * 1000);
    let utc = false;
    let i = 0;
    if (s[i] === '!'.charCodeAt(0)) {  /* UTC? */
        utc = true;
        i++;  /* skip '!' */
    }
    if (s[i] === "*".charCodeAt(0) && s[i+1] === "t".charCodeAt(0)) {
        lua_createtable(L, 0, 9);  /* 9 = number of fields */
        setallfields(L, stm, utc);
    } else {
        let b = new luaL_Buffer();
        luaL_buffinit(L, b);
        strftime(L, b, s.subarray(i), stm, utc);  /* subarray: the '!' is not part of the format */
        luaL_pushresult(b);
    }
    return 1;
};

const os_time = function(L) {
    let t;
    if (lua_isnoneornil(L, 1))  /* called without args? */
        t = new Date();  /* get current time */
    else {
        luaL_checktype(L, 1, LUA_TTABLE);
        lua_settop(L, 1);  /* make sure table is at the top */
        t = new Date(
            getfield(L, "year", -1, 0),
            getfield(L, "month", -1, 1),
            getfield(L, "day", -1, 0),
            getfield(L, "hour", 12, 0),
            getfield(L, "min", 0, 0),
            getfield(L, "sec", 0, 0)
        );
        setallfields(L, t);
    }

    lua_pushinteger(L, Math.floor(t / 1000));
    return 1;
};

const l_checktime = function(L, arg) {
    let t = luaL_checkinteger(L, arg);
    // luaL_argcheck(L, t, arg, "time out-of-bounds");
    return t;
};

const os_difftime = function(L) {
    let t1 = l_checktime(L, 1);
    let t2 = l_checktime(L, 2);
    lua_pushnumber(L, t1 - t2);
    return 1;
};

const catnames = ["all", "collate", "ctype", "monetary", "numeric", "time"].map((lc) => to_luastring(lc));
const C = to_luastring("C");
const POSIX = to_luastring("POSIX");
const os_setlocale = function(L) {
    const l = luaL_optstring(L, 1, null);
    luaL_checkoption(L, 2, "all", catnames);
    /* It is not possible to set the JS-VM wide locale, so we say that we only
       know the C locale. The "POSIX" locale is defined in
       IEEE Std 1003.1-2017 Section 7.2 as equivalent to "C" */
    lua_pushstring(L, (
        l === null /* passing nil returns the current locale; which is "C" */
        || l.length == 0 /* empty string resets to the default locale; which is "C" */
        || luastring_eq(l, C) /* user passed "C" */
        || luastring_eq(l, POSIX) /* user passed "POSIX", equivalent to "C" */
    ) ? C : null);
    return 1;
};

const syslib = {
    "date": os_date,
    "difftime": os_difftime,
    "setlocale": os_setlocale,
    "time": os_time
};

if (typeof process === "undefined") {
    syslib.clock = function(L) {
        lua_pushnumber(L, performance.now()/1000);
        return 1;
    };
} else {
    /* Only with Node */
    const fs = require('fs');
    const tmp = require('tmp');
    const child_process = require('child_process');

    syslib.exit = function(L) {
        let status;
        if (lua_isboolean(L, 1))
            status = (lua_toboolean(L, 1) ? 0 : 1);
        else
            status = luaL_optinteger(L, 1, 0);
        if (lua_toboolean(L, 2))
            lua_close(L);
        if (L) process.exit(status);  /* 'if' to avoid warnings for unreachable 'return' */
        return 0;
    };

    syslib.getenv = function(L) {
        let key = luaL_checkstring(L, 1);
        key = to_jsstring(key); /* https://github.com/nodejs/node/issues/16961 */
        if (Object.prototype.hasOwnProperty.call(process.env, key)) {
            lua_pushliteral(L, process.env[key]);
        } else {
            lua_pushnil(L);
        }
        return 1;
    };

    syslib.clock = function(L) {
        lua_pushnumber(L, process.uptime());
        return 1;
    };

    const lua_tmpname = function() {
        return tmp.tmpNameSync();
    };

    syslib.remove = function(L) {
        let filename = luaL_checkstring(L, 1);
        try {
            fs.unlinkSync(filename);
        } catch (e) {
            if (e.code === 'EISDIR') {
                try {
                    fs.rmdirSync(filename);
                } catch (e) {
                    return luaL_fileresult(L, false, filename, e);
                }
            } else {
                return luaL_fileresult(L, false, filename, e);
            }
        }
        return luaL_fileresult(L, true);
    };

    syslib.rename = function(L) {
        let fromname = luaL_checkstring(L, 1);
        let toname = luaL_checkstring(L, 2);
        try {
            fs.renameSync(fromname, toname);
        } catch (e) {
            return luaL_fileresult(L, false, false, e);
        }
        return luaL_fileresult(L, true);
    };

    syslib.tmpname = function(L) {
        let name = lua_tmpname();
        if (!name)
            return luaL_error(L, to_luastring("unable to generate a unique filename"));
        lua_pushstring(L, to_luastring(name));
        return 1;
    };

    syslib.execute = function(L) {
        let cmd = luaL_optstring(L, 1, null);
        if (cmd !== null) {
            cmd = to_jsstring(cmd);
            try {
                child_process.execSync(
                    cmd,
                    {
                        stdio: [process.stdin, process.stdout, process.stderr]
                    }
                );
            } catch (e) {
                return luaL_execresult(L, e);
            }

            return luaL_execresult(L, null);
        } else {
            /* Assume a shell is available.
               If it's good enough for musl it's good enough for us.
               http://git.musl-libc.org/cgit/musl/tree/src/process/system.c?id=ac45692a53a1b8d2ede329d91652d43c1fb5dc8d#n22
            */
            lua_pushboolean(L, 1);
            return 1;
        }
    };
}

const luaopen_os = function(L) {
    luaL_newlib(L, syslib);
    return 1;
};

module.exports.luaopen_os = luaopen_os;
