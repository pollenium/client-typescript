"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var Bytes_1 = require("./Bytes");
var events_1 = __importDefault(require("events"));
var Missive_1 = require("./Missive");
var utils_1 = require("../utils");
var FRIEND_STATUS;
(function (FRIEND_STATUS) {
    FRIEND_STATUS[FRIEND_STATUS["DEFAULT"] = 0] = "DEFAULT";
    FRIEND_STATUS[FRIEND_STATUS["CONNECTING"] = 1] = "CONNECTING";
    FRIEND_STATUS[FRIEND_STATUS["CONNECTED"] = 2] = "CONNECTED";
    FRIEND_STATUS[FRIEND_STATUS["DESTROYED"] = 3] = "DESTROYED";
})(FRIEND_STATUS = exports.FRIEND_STATUS || (exports.FRIEND_STATUS = {}));
var Friend = (function (_super) {
    __extends(Friend, _super);
    function Friend(client, simplePeer) {
        var _this = _super.call(this) || this;
        _this.client = client;
        _this.simplePeer = simplePeer;
        _this.status = FRIEND_STATUS.DEFAULT;
        _this.createdAt = utils_1.getNow();
        _this.setSimplePeerListeners();
        return _this;
    }
    Friend.prototype.setStatus = function (status) {
        if (this.status !== undefined && status <= this.status) {
            throw new Error('Can only increase status');
        }
        this.status = status;
        if (this.peerClientNonce) {
            this.client.setFriendStatusByClientNonce(this.peerClientNonce, status);
        }
        this.emit('status', status);
        this.client.emit('friend.status', {
            friend: this,
            status: this.status
        });
    };
    Friend.prototype.getDistance = function () {
        if (this.peerClientNonce === undefined) {
            throw new Error('peerClientNonce not yet established');
        }
        return this.peerClientNonce.getXor(this.client.nonce);
    };
    Friend.prototype.setSimplePeerListeners = function () {
        var _this = this;
        this.simplePeer.on('iceStateChange', function (iceConnectionState) {
            if (iceConnectionState === 'disconnected') {
                _this.destroy();
            }
        });
        this.simplePeer.on('connect', function () {
            _this.setStatus(FRIEND_STATUS.CONNECTED);
        });
        this.simplePeer.on('data', function (missiveEncodingBuffer) {
            var missive = Missive_1.Missive.fromEncoding(_this.client, Bytes_1.Bytes.fromBuffer(missiveEncodingBuffer));
            _this.handleMessage(missive);
        });
        this.simplePeer.once('error', function () {
            _this.destroy();
        });
        this.simplePeer.once('close', function () {
            _this.destroy();
        });
    };
    Friend.prototype.destroy = function () {
        var _this = this;
        if (this.simplePeer) {
            this.destroySimplePeer();
        }
        this.setStatus(FRIEND_STATUS.DESTROYED);
        setTimeout(function () {
            _this.removeAllListeners();
        });
        this.client.createFriend();
    };
    Friend.prototype.destroySimplePeer = function () {
        this.simplePeer.removeAllListeners();
        this.simplePeer.destroy();
    };
    Friend.prototype.send = function (bytes) {
        if (this.status !== FRIEND_STATUS.CONNECTED) {
            throw new Error('Cannot send unless FRIEND_STATUS.CONNECTED');
        }
        this.simplePeer.send(bytes.uint8Array);
    };
    Friend.prototype.sendMessage = function (missive) {
        this.send(missive.getEncoding());
    };
    Friend.prototype.handleMessage = function (missive) {
        var _this = this;
        if (missive.getIsReceived()) {
            return;
        }
        missive.markIsReceived();
        this.client.emit('friend.message', missive);
        this.client.getFriends().forEach(function (friend) {
            if (friend === _this) {
                return;
            }
            if (friend.status !== FRIEND_STATUS.CONNECTED) {
                return;
            }
            friend.sendMessage(missive);
        });
    };
    return Friend;
}(events_1.default));
exports.Friend = Friend;
//# sourceMappingURL=Friend.js.map