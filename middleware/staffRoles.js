//backend\middleware\staffRoles.js
module.exports = (...allowedRoles) => {

    return (req, res, next) => {

        if (!req.staff) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        if (!allowedRoles.includes(req.staff.role)) {
            return res.status(403).json({
                success: false,
                message: "Access denied"
            });
        }

        next();

    };

};