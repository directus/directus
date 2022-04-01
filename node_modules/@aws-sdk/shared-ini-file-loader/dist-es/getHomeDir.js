import { homedir } from "os";
import { sep } from "path";
export var getHomeDir = function () {
    var _a = process.env, HOME = _a.HOME, USERPROFILE = _a.USERPROFILE, HOMEPATH = _a.HOMEPATH, _b = _a.HOMEDRIVE, HOMEDRIVE = _b === void 0 ? "C:".concat(sep) : _b;
    if (HOME)
        return HOME;
    if (USERPROFILE)
        return USERPROFILE;
    if (HOMEPATH)
        return "".concat(HOMEDRIVE).concat(HOMEPATH);
    return homedir();
};
