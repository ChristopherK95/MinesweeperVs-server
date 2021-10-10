"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameController = void 0;
var socket_controllers_1 = require("socket-controllers");
var socket_io_1 = require("socket.io");
var GameController = /** @class */ (function () {
    function GameController() {
    }
    GameController.prototype.getSocketGameRoom = function (socket) {
        var socketRooms = Array.from(socket.rooms.values()).filter(function (r) { return r !== socket.id; });
        var gameRoom = socketRooms && socketRooms[0];
        return gameRoom;
    };
    GameController.prototype.startGame = function (io, socket, message) {
        var tilesSet = false;
        var tileAmount = message.tileAmount;
        var max = tileAmount - 1;
        var tileArray = [];
        var id = 0;
        var lower = Math.floor(0.2 * tileAmount);
        var higher = Math.floor(0.6 * tileAmount);
        console.log(message);
        for (var i = 0; i < tileAmount; i++) {
            for (var j = 0; j < tileAmount; j++) {
                var tile = { clicked: false, id: id, position: { x: j, y: i }, mine: false, count: 0, flagged: false };
                tileArray.push(tile);
                id++;
            }
        }
        putBombs();
        calcNearbyMines();
        socket.emit("game_setup", tileArray);
        function putBombs() {
            var mines = message.bombs;
            for (var i = 0; i < tileArray.length; i++) {
                if (mines === 0)
                    return;
                var mine = Math.random();
                if ((tileArray[i].position.x < lower && tileArray[i].position.y < lower || (tileArray[i].position.x > higher && tileArray[i].position.y < higher)) || (tileArray[i].position.x < lower && tileArray[i].position.y > higher) || (tileArray[i].position.x > higher && tileArray[i].position.y < lower)) {
                    if (mine > 0.7 && tileArray[i].mine === false) {
                        tileArray[i].mine = true;
                        mines--;
                    }
                }
                else {
                    if (mine > 0.9 && tileArray[i].mine === false) {
                        tileArray[i].mine = true;
                        mines--;
                    }
                }
                if (i === tileArray.length - 1 && mines > 0)
                    i = 0;
            }
        }
        function calcNearbyMines() {
            for (var i = 0; i < tileArray.length; i++) {
                if (tileArray[i].mine === true)
                    continue;
                if (tileArray[i].position.x === 0 && tileArray[i].position.y === 0) {
                    tileArray[i].count = calcCorners(0, 0, i);
                    continue;
                }
                if (tileArray[i].position.x === max && tileArray[i].position.y === 0) {
                    tileArray[i].count = calcCorners(max, 0, i);
                    continue;
                }
                if (tileArray[i].position.x === 0 && tileArray[i].position.y === max) {
                    tileArray[i].count = calcCorners(0, max, i);
                    continue;
                }
                if (tileArray[i].position.x === max && tileArray[i].position.y === max) {
                    tileArray[i].count = calcCorners(max, max, i);
                    continue;
                }
                if (tileArray[i].position.x === 0 || tileArray[i].position.x === max || tileArray[i].position.y === 0 || tileArray[i].position.y === max) {
                    tileArray[i].count = calcOuter(tileArray[i].position.x, tileArray[i].position.y, i);
                    continue;
                }
                tileArray[i].count = calcInner(i);
            }
        }
        function calcInner(id) {
            var count = 0;
            if (tileArray[id - 1].mine === true)
                count++;
            if (tileArray[id + 1].mine === true)
                count++;
            if (tileArray[id + tileAmount].mine === true)
                count++;
            if (tileArray[id - tileAmount].mine === true)
                count++;
            if (tileArray[id - tileAmount - 1].mine === true)
                count++;
            if (tileArray[id - tileAmount + 1].mine === true)
                count++;
            if (tileArray[id + tileAmount - 1].mine === true)
                count++;
            if (tileArray[id + tileAmount + 1].mine === true)
                count++;
            return count;
        }
        function calcOuter(x, y, id) {
            var count = 0;
            // Leftmost tiles.
            if (x === 0) {
                if (tileArray[id - tileAmount].mine === true)
                    count++;
                if (tileArray[id + 1].mine === true)
                    count++;
                if (tileArray[id + tileAmount].mine === true)
                    count++;
                if (tileArray[id - tileAmount + 1].mine === true)
                    count++;
                if (tileArray[id + tileAmount + 1].mine === true)
                    count++;
            }
            // Rightmost tiles.
            else if (x === max) {
                if (tileArray[id - tileAmount].mine === true)
                    count++;
                if (tileArray[id - 1].mine === true)
                    count++;
                if (tileArray[id + tileAmount].mine === true)
                    count++;
                if (tileArray[id - tileAmount - 1].mine === true)
                    count++;
                if (tileArray[id + tileAmount - 1].mine === true)
                    count++;
            }
            // Top tiles.
            else if (y === 0) {
                if (tileArray[id - 1].mine === true)
                    count++;
                if (tileArray[id + 1].mine === true)
                    count++;
                if (tileArray[id + tileAmount].mine === true)
                    count++;
                if (tileArray[id + tileAmount - 1].mine === true)
                    count++;
                if (tileArray[id + tileAmount + 1].mine === true)
                    count++;
            }
            // Bottom tiles.
            else {
                if (tileArray[id - 1].mine === true)
                    count++;
                if (tileArray[id + 1].mine === true)
                    count++;
                if (tileArray[id - tileAmount].mine === true)
                    count++;
                if (tileArray[id - tileAmount - 1].mine === true)
                    count++;
                if (tileArray[id - tileAmount + 1].mine === true)
                    count++;
            }
            return count;
        }
        function calcCorners(x, y, id) {
            var count = 0;
            // Top left corner.
            if (x === 0 && y === 0) {
                if (tileArray[id + 1].mine === true)
                    count++;
                if (tileArray[id + tileAmount].mine === true)
                    count++;
                if (tileArray[id + tileAmount + 1].mine === true)
                    count++;
                return count;
            }
            // Top right corner.
            else if (x !== 0 && y === 0) {
                if (tileArray[id - 1].mine === true)
                    count++;
                if (tileArray[id + tileAmount].mine === true)
                    count++;
                if (tileArray[id + tileAmount - 1].mine === true)
                    count++;
                return count;
            }
            // Bottom left corner.
            else if (y !== 0 && x === 0) {
                if (tileArray[id - tileAmount].mine === true)
                    count++;
                if (tileArray[id - 1].mine === true)
                    count++;
                if (tileArray[id - tileAmount + 1].mine === true)
                    count++;
                return count;
            }
            // Bottom right corner.
            else {
                if (tileArray[id - tileAmount].mine === true)
                    count++;
                if (tileArray[id - tileAmount - 1].mine === true)
                    count++;
                if (tileArray[id - 1].mine === true)
                    count++;
                return count;
            }
        }
    };
    GameController.prototype.tileClick = function (io, socket, message) {
        var gameRoom = this.getSocketGameRoom(socket);
        socket.to(gameRoom).emit("on_game_update", message);
    };
    GameController.prototype.updateTime = function (io, socket, message) {
        var gameRoom = this.getSocketGameRoom(socket);
        socket.to(gameRoom).emit("on_time_update", message);
    };
    GameController.prototype.outOfTime = function (io, socket, message) {
        var gameRoom = this.getSocketGameRoom(socket);
        socket.to(gameRoom).emit("on_timeout", message);
    };
    GameController.prototype.gameOver = function (io, socket, message) {
        var gameRoom = this.getSocketGameRoom(socket);
        socket.to(gameRoom).emit("on_game_over", message);
    };
    GameController.prototype.ready = function (socket) {
        var gameRoom = this.getSocketGameRoom(socket);
        socket.to(gameRoom).emit("on_ready");
    };
    __decorate([
        socket_controllers_1.OnMessage("prepare_game"),
        __param(0, socket_controllers_1.SocketIO()),
        __param(1, socket_controllers_1.ConnectedSocket()),
        __param(2, socket_controllers_1.MessageBody()),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [socket_io_1.Server, socket_io_1.Socket, Object]),
        __metadata("design:returntype", void 0)
    ], GameController.prototype, "startGame", null);
    __decorate([
        socket_controllers_1.OnMessage("tile_click"),
        __param(0, socket_controllers_1.SocketIO()),
        __param(1, socket_controllers_1.ConnectedSocket()),
        __param(2, socket_controllers_1.MessageBody()),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [socket_io_1.Server, socket_io_1.Socket, Object]),
        __metadata("design:returntype", void 0)
    ], GameController.prototype, "tileClick", null);
    __decorate([
        socket_controllers_1.OnMessage("update_time"),
        __param(0, socket_controllers_1.SocketIO()),
        __param(1, socket_controllers_1.ConnectedSocket()),
        __param(2, socket_controllers_1.MessageBody()),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [socket_io_1.Server, socket_io_1.Socket, Object]),
        __metadata("design:returntype", void 0)
    ], GameController.prototype, "updateTime", null);
    __decorate([
        socket_controllers_1.OnMessage("out_of_time"),
        __param(0, socket_controllers_1.SocketIO()),
        __param(1, socket_controllers_1.ConnectedSocket()),
        __param(2, socket_controllers_1.MessageBody()),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [socket_io_1.Server, socket_io_1.Socket, Object]),
        __metadata("design:returntype", void 0)
    ], GameController.prototype, "outOfTime", null);
    __decorate([
        socket_controllers_1.OnMessage("game_over"),
        __param(0, socket_controllers_1.SocketIO()),
        __param(1, socket_controllers_1.ConnectedSocket()),
        __param(2, socket_controllers_1.MessageBody()),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [socket_io_1.Server, socket_io_1.Socket, Object]),
        __metadata("design:returntype", void 0)
    ], GameController.prototype, "gameOver", null);
    __decorate([
        socket_controllers_1.OnMessage("ready"),
        __param(0, socket_controllers_1.ConnectedSocket()),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [socket_io_1.Socket]),
        __metadata("design:returntype", void 0)
    ], GameController.prototype, "ready", null);
    GameController = __decorate([
        socket_controllers_1.SocketController()
    ], GameController);
    return GameController;
}());
exports.GameController = GameController;
