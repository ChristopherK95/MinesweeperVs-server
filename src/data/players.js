"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientsDB = void 0;
var ClientsDB = /** @class */ (function () {
    function ClientsDB() {
    }
    ClientsDB.getPlayer = function (id) {
        var player = ClientsDB.clients.find(function (client) { return client.id === id; });
        return player;
    };
    ClientsDB.setPlayer = function (player) {
        ClientsDB.clients.push(player);
    };
    ClientsDB.clients = [];
    return ClientsDB;
}());
exports.ClientsDB = ClientsDB;
