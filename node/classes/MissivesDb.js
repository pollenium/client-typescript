"use strict";
exports.__esModule = true;
var MissivesDb = /** @class */ (function () {
    function MissivesDb() {
        this.isReceivedByIdHex = {};
    }
    MissivesDb.prototype.getIsReceived = function (missive) {
        var missiveIdHex = missive.getId().uu.toHex();
        return this.isReceivedByIdHex[missiveIdHex] === true;
    };
    MissivesDb.prototype.markIsReceived = function (missive) {
        var missiveIdHex = missive.getId().uu.toHex();
        this.isReceivedByIdHex[missiveIdHex] = true;
    };
    return MissivesDb;
}());
exports.MissivesDb = MissivesDb;
