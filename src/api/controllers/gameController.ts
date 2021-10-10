import { ConnectedSocket, OnConnect, MessageBody, OnMessage, SocketController, SocketIO } from "socket-controllers";
import { Socket, Server } from "socket.io";

interface Tile {
  clicked: boolean;
  id: number;
  position: { x: number; y: number };
  mine: boolean;
  count: number;
  flagged: boolean;
}

@SocketController()
export class GameController {
  
  private getSocketGameRoom(socket: Socket): string {
    const socketRooms = Array.from(socket.rooms.values()).filter((r) => r !== socket.id);
    const gameRoom = socketRooms && socketRooms[0];
    return gameRoom;
  }

  @OnMessage("prepare_game")
  public startGame(@SocketIO() io: Server, @ConnectedSocket() socket: Socket, @MessageBody() message: {bombs: number, tileAmount: number}) {
    var tilesSet = false;
    const tileAmount = message.tileAmount;
    var max = tileAmount - 1;
    var tileArray: Array<Tile> = [];
    var id = 0;
    const lower = Math.floor(0.2 * tileAmount);
    const higher = Math.floor(0.6 * tileAmount)
    console.log(message)
    for (let i = 0; i < tileAmount; i++) {
      for (let j = 0; j < tileAmount; j++) {
        let tile: Tile = { clicked: false, id: id, position: { x: j, y: i }, mine: false, count: 0, flagged: false };
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
        if (mines === 0) return;
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

        if (i === tileArray.length - 1 && mines > 0) i = 0;
      }
    }

    function calcNearbyMines() {
      for (var i = 0; i < tileArray.length; i++) {
        if (tileArray[i].mine === true) continue;
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
      if (tileArray[id - 1].mine === true) count++;
      if (tileArray[id + 1].mine === true) count++;
      if (tileArray[id + tileAmount].mine === true) count++;
      if (tileArray[id - tileAmount].mine === true) count++;
      if (tileArray[id - tileAmount - 1].mine === true) count++;
      if (tileArray[id - tileAmount + 1].mine === true) count++;
      if (tileArray[id + tileAmount - 1].mine === true) count++;
      if (tileArray[id + tileAmount + 1].mine === true) count++;
      return count;
    }

    function calcOuter(x, y, id) {
      var count = 0;
      // Leftmost tiles.
      if (x === 0) {
        if (tileArray[id - tileAmount].mine === true) count++;
        if (tileArray[id + 1].mine === true) count++;
        if (tileArray[id + tileAmount].mine === true) count++;
        if (tileArray[id - tileAmount + 1].mine === true) count++;
        if (tileArray[id + tileAmount + 1].mine === true) count++;
      }
      // Rightmost tiles.
      else if (x === max) {
        if (tileArray[id - tileAmount].mine === true) count++;
        if (tileArray[id - 1].mine === true) count++;
        if (tileArray[id + tileAmount].mine === true) count++;
        if (tileArray[id - tileAmount - 1].mine === true) count++;
        if (tileArray[id + tileAmount - 1].mine === true) count++;
      }
      // Top tiles.
      else if (y === 0) {
        if (tileArray[id - 1].mine === true) count++;
        if (tileArray[id + 1].mine === true) count++;
        if (tileArray[id + tileAmount].mine === true) count++;
        if (tileArray[id + tileAmount - 1].mine === true) count++;
        if (tileArray[id + tileAmount + 1].mine === true) count++;
      }
      // Bottom tiles.
      else {
        if (tileArray[id - 1].mine === true) count++;
        if (tileArray[id + 1].mine === true) count++;
        if (tileArray[id - tileAmount].mine === true) count++;
        if (tileArray[id - tileAmount - 1].mine === true) count++;
        if (tileArray[id - tileAmount + 1].mine === true) count++;
      }
      return count;
    }

    function calcCorners(x, y, id) {
      var count = 0;
      // Top left corner.
      if (x === 0 && y === 0) {
        if (tileArray[id + 1].mine === true) count++;
        if (tileArray[id + tileAmount].mine === true) count++;
        if (tileArray[id + tileAmount + 1].mine === true) count++;
        return count;
      }
      // Top right corner.
      else if (x !== 0 && y === 0) {
        if (tileArray[id - 1].mine === true) count++;
        if (tileArray[id + tileAmount].mine === true) count++;
        if (tileArray[id + tileAmount - 1].mine === true) count++;
        return count;
      }
      // Bottom left corner.
      else if (y !== 0 && x === 0) {
        if (tileArray[id - tileAmount].mine === true) count++;
        if (tileArray[id - 1].mine === true) count++;
        if (tileArray[id - tileAmount + 1].mine === true) count++;
        return count;
      }
      // Bottom right corner.
      else {
        if (tileArray[id - tileAmount].mine === true) count++;
        if (tileArray[id - tileAmount - 1].mine === true) count++;
        if (tileArray[id - 1].mine === true) count++;
        return count;
      }
    }

  }

  @OnMessage("tile_click")
  public tileClick(@SocketIO() io: Server, @ConnectedSocket() socket: Socket, @MessageBody() message: any) {
    const gameRoom = this.getSocketGameRoom(socket);
    socket.to(gameRoom).emit("on_game_update", message);
  }

  @OnMessage("update_time")
  public updateTime(@SocketIO() io: Server, @ConnectedSocket() socket: Socket, @MessageBody() message: any) {
    const gameRoom = this.getSocketGameRoom(socket);
    socket.to(gameRoom).emit("on_time_update", message);
  }

  @OnMessage("out_of_time")
  public outOfTime(@SocketIO() io: Server, @ConnectedSocket() socket: Socket, @MessageBody() message: any) {
    const gameRoom = this.getSocketGameRoom(socket);
    socket.to(gameRoom).emit("on_timeout", message);
  }

  @OnMessage("game_over")
  public gameOver(@SocketIO() io: Server, @ConnectedSocket() socket: Socket, @MessageBody() message: any){
    const gameRoom = this.getSocketGameRoom(socket);
    socket.to(gameRoom).emit("on_game_over", message);
  }

  @OnMessage("ready")
  public ready(@ConnectedSocket() socket: Socket){
    const gameRoom = this.getSocketGameRoom(socket);
    socket.to(gameRoom).emit("on_ready");
  }
}

