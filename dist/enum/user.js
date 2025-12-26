"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.USER_STATUS = exports.USER_ROLES = void 0;
// export enum USER_ROLES {
//   ADMIN = 'admin',
//   CREATOR = 'creator',
//   USER = 'user'
// }
var USER_ROLES;
(function (USER_ROLES) {
    USER_ROLES["SUPER_ADMIN"] = "super_admin";
    USER_ROLES["ADMIN"] = "admin";
    USER_ROLES["CLIENT"] = "client";
    USER_ROLES["STAFF"] = "staff";
})(USER_ROLES || (exports.USER_ROLES = USER_ROLES = {}));
var USER_STATUS;
(function (USER_STATUS) {
    USER_STATUS["ACTIVE"] = "active";
    USER_STATUS["INACTIVE"] = "inactive";
    USER_STATUS["DELETED"] = "deleted";
})(USER_STATUS || (exports.USER_STATUS = USER_STATUS = {}));
