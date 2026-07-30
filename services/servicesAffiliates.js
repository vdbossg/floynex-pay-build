//backend\services\servicesAffiliates.js
const Affiliate = require("../models/Affiliate");

const CHARACTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const randomCode = () => {

    let code = "PQ";

    while (code.length < 8) {

        code += CHARACTERS.charAt(
            Math.floor(Math.random() * CHARACTERS.length)
        );

    }
    return code;
};

const generateAffiliateCode = async () => {

    let promoCode;
    let exists = true;

    while (exists) {

        promoCode = randomCode();

        const affiliate = await Affiliate.findOne({ promoCode });

        if (!affiliate) {

            exists = false;

        }

    }

    return promoCode;

};

module.exports = {
    generateAffiliateCode
};
