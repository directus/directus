export var ENV_PROFILE = "AWS_PROFILE";
export var DEFAULT_PROFILE = "default";
export var getProfileName = function (init) {
    return init.profile || process.env[ENV_PROFILE] || DEFAULT_PROFILE;
};
