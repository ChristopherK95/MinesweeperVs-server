"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Rooms = void 0;
var Rooms = /** @class */ (function () {
    function Rooms() {
    }
    Rooms.getRoom = function (roomId) {
        return Rooms.rooms.find(function (r) { return r.roomId === roomId; });
    };
    Rooms.getRoomByPlayer = function (playerId) {
        return Rooms.rooms.find(function (r) { return r.players.includes(playerId); });
    };
    Rooms.setRoom = function (room) {
        this.rooms.push(room);
    };
    Rooms.getSettings = function (roomId) {
        return Rooms.rooms.find(function (r) { return r.roomId === roomId; }).settings;
    };
    Rooms.setSettings = function (roomId, settings) {
        this.getRoom(roomId).settings = settings;
    };
    Rooms.rooms = [];
    return Rooms;
}());
exports.Rooms = Rooms;
