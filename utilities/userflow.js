exports.userLoggedOut = function userLoggedOut(request, response, next) {
    if (request.session.userSigned) {
        response.redirect("/petition/gratitude");
    } else if (request.session.userLoggedIn) {
        response.redirect("/petition/sign");
    } else {
        next();
    }
};

exports.userLoggedIn = function userLoggedIn(request, response, next) {
    if (request.session.userSigned) {
        response.redirect("/petition/gratitude");
    } else if (request.session.userLoggedIn) {
        next();
    } else {
        response.redirect("/petition/register");
    }
};

exports.userSigned = function userSigned(request, response, next) {
    if (request.session.userLoggedIn && request.session.userSigned) {
        next();
    } else if (request.session.userLoggedIn) {
        response.redirect("/petition/sign");
    } else {
        response.redirect("/petition/register");
    }
};
