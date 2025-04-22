const objectId = (value, helpers) => {
    if (!value.match(/^[0-9a-fA-F]{24}$/)) {
        return helpers.message('"{{#label}}" must be a valid id');
    }
    return value;
};

const password = (value, helpers) => {
    if (value.length < 8) {
        return helpers.message('Password must be at least 8 characters');
    }
    if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
        return helpers.message('Password must contain at least 1 letter and 1 number');
    }
    return value;
};

const name = (value, helpers) => {
    if (!value.match(/^[a-zA-Z. ]*$/)) {
        return helpers.message('"{{#label}}" should not contain any special characters and numbers');
    }
    return value;
};

const pincode = (value, helpers) => {
    if (!value.match(/^[a-zA-Z. ]*$/)) {
        return helpers.message('"{{#label}}" should not contain any special characters and numbers');
    }
    return value;
};

const checkAmount = (amount) => {
    if (isNaN(amount)) {
        return false;
    }
    if (amount < 0) {
        return false;
    }
    return true;
}

const checkNumber = (num) => {
    if (isNaN(num)) {
        return false;
    }
    if (num < 0) {
        return false;
    }
    return true;
    /*num.toString();
    if(num.match(/^\d+$/)){
        return true;
    }
    {
        return false;
    }*/
}

const checkPhoneNumber = (num) => {
    if (isNaN(num)) {
        return false;
    }
    if (num < 0) {
        return false;
    }
    if (num.length != 10){
        return false;
    }
    return true;
}

const checkPincode = (num) => {
    if (isNaN(num)) {
        return false;
    }
    if (num < 0) {
        return false;
    }
    if (num.length < 5 || num.length > 6){
        return false;
    }
    return true;
}

const checkRoutingNumber = (num) => {
    if (num.length < 5 || num.length > 15){
        return false;
    }
    return true;
}

const checkEmail = (email) => {
    let emailRegex = /^[-!#$%&'*+\/0-9=?A-Z^_a-z{|}~](\.?[-!#$%&'*+\/0-9=?A-Z^_a-z`{|}~])*@[a-zA-Z0-9](-*\.?[a-zA-Z0-9])*\.[a-zA-Z](-?[a-zA-Z0-9])+$/;
    if (!email)
        return false;

    if (email.length > 254)
        return false;

    let valid = emailRegex.test(email);
    if (!valid)
        return false;

    // Further checking of some things regex can't handle
    let parts = email.split("@");
    if (parts[0].length > 64)
        return false;

    let domainParts = parts[1].split(".");
    if (domainParts.some(function (part) { return part.length > 63; }))
        return false;

    return true;
}

module.exports = {
    objectId,
    password,
    name,

    checkEmail,
    checkAmount,
    checkNumber,
    checkPhoneNumber,
    checkPincode,
    checkRoutingNumber
};