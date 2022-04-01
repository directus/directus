export var isSsoProfile = function (arg) {
    return arg &&
        (typeof arg.sso_start_url === "string" ||
            typeof arg.sso_account_id === "string" ||
            typeof arg.sso_region === "string" ||
            typeof arg.sso_role_name === "string");
};
