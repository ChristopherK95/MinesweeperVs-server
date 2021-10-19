import { ConnectedSocket, OnConnect, MessageBody, OnMessage, SocketController, SocketIO } from "socket-controllers";
import { Socket, Server } from "socket.io";
import {ClientsDB} from "../../data/players";

interface Event {
  user: string;
  info: {
    position: { x:number, y:number},
    score: number;
  }
}

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
  public startGame(@SocketIO() io: Server, @ConnectedSocket() socket: Socket, @MessageBody() message: {bombs: number, tileAmount: number, id: number, tileArr: Tile[]}) {
    const gameRoom = this.getSocketGameRoom(socket);
    const tileAmount = message.tileAmount;
    const tileArr = message.tileArr;
    const id = message.id;
    var max = tileAmount - 1;
    const lower = Math.floor(0.2 * tileAmount);
    const higher = Math.floor(0.6 * tileAmount)

    putBombs(id);
    calcNearbyMines();
    
    const score: number = tileArr[id].mine
    ? -5
    : tileArr[id].count === 0
    ? 3
    : tileArr[id].count;
    const event: Event = {
      user: ClientsDB.getPlayer(socket.id).name,
      info: {
        position: { x: tileArr[id].position.x, y: tileArr[id].position.y },
        score: score,
      },
    };
    checkNearbyEmpty(id, tileArr);

    socket.emit("game_setup1", {tileArr, score, event});
    socket.to(gameRoom).emit("game_setup2", {tileArr, score, event});

    function putBombs(id: number) {
      var mines = message.bombs;
      for (var i = 0; i < tileArr.length; i++) {
        if (mines === 0) return;
        if(i === id) {
          tileArr[i].clicked = true;
          continue;
        }
        var mine = Math.random();
        if ((tileArr[i].position.x < lower && tileArr[i].position.y < lower || (tileArr[i].position.x > higher && tileArr[i].position.y < higher)) || (tileArr[i].position.x < lower && tileArr[i].position.y > higher) || (tileArr[i].position.x > higher && tileArr[i].position.y < lower)) {
          if (mine > 0.7 && tileArr[i].mine === false) {
            tileArr[i].mine = true;
            mines--;
          }
        }
        else {
          if (mine > 0.9 && tileArr[i].mine === false) {
            tileArr[i].mine = true;
            mines--;
          }
        }

        if (i === tileArr.length - 1 && mines > 0) i = 0;
      }
    }

    function calcNearbyMines() {
      for (var i = 0; i < tileArr.length; i++) {
        if (tileArr[i].mine === true) continue;
        if (tileArr[i].position.x === 0 && tileArr[i].position.y === 0) {
          tileArr[i].count = calcCorners(0, 0, i);
          continue;
        }
        if (tileArr[i].position.x === max && tileArr[i].position.y === 0) {
          tileArr[i].count = calcCorners(max, 0, i);
          continue;
        }
        if (tileArr[i].position.x === 0 && tileArr[i].position.y === max) {
          tileArr[i].count = calcCorners(0, max, i);
          continue;
        }
        if (tileArr[i].position.x === max && tileArr[i].position.y === max) {
          tileArr[i].count = calcCorners(max, max, i);
          continue;
        }

        if (tileArr[i].position.x === 0 || tileArr[i].position.x === max || tileArr[i].position.y === 0 || tileArr[i].position.y === max) {
          tileArr[i].count = calcOuter(tileArr[i].position.x, tileArr[i].position.y, i);
          continue;
        }

        tileArr[i].count = calcInner(i);
      }
    }

    function calcInner(id) {
      var count = 0;
      if (tileArr[id - 1].mine === true) count++;
      if (tileArr[id + 1].mine === true) count++;
      if (tileArr[id + tileAmount].mine === true) count++;
      if (tileArr[id - tileAmount].mine === true) count++;
      if (tileArr[id - tileAmount - 1].mine === true) count++;
      if (tileArr[id - tileAmount + 1].mine === true) count++;
      if (tileArr[id + tileAmount - 1].mine === true) count++;
      if (tileArr[id + tileAmount + 1].mine === true) count++;
      return count;
    }

    function calcOuter(x, y, id) {
      var count = 0;
      // Leftmost tiles.
      if (x === 0) {
        if (tileArr[id - tileAmount].mine === true) count++;
        if (tileArr[id + 1].mine === true) count++;
        if (tileArr[id + tileAmount].mine === true) count++;
        if (tileArr[id - tileAmount + 1].mine === true) count++;
        if (tileArr[id + tileAmount + 1].mine === true) count++;
      }
      // Rightmost tiles.
      else if (x === max) {
        if (tileArr[id - tileAmount].mine === true) count++;
        if (tileArr[id - 1].mine === true) count++;
        if (tileArr[id + tileAmount].mine === true) count++;
        if (tileArr[id - tileAmount - 1].mine === true) count++;
        if (tileArr[id + tileAmount - 1].mine === true) count++;
      }
      // Top tiles.
      else if (y === 0) {
        if (tileArr[id - 1].mine === true) count++;
        if (tileArr[id + 1].mine === true) count++;
        if (tileArr[id + tileAmount].mine === true) count++;
        if (tileArr[id + tileAmount - 1].mine === true) count++;
        if (tileArr[id + tileAmount + 1].mine === true) count++;
      }
      // Bottom tiles.
      else {
        if (tileArr[id - 1].mine === true) count++;
        if (tileArr[id + 1].mine === true) count++;
        if (tileArr[id - tileAmount].mine === true) count++;
        if (tileArr[id - tileAmount - 1].mine === true) count++;
        if (tileArr[id - tileAmount + 1].mine === true) count++;
      }
      return count;
    }

    function calcCorners(x, y, id) {
      var count = 0;
      // Top left corner.
      if (x === 0 && y === 0) {
        if (tileArr[id + 1].mine === true) count++;
        if (tileArr[id + tileAmount].mine === true) count++;
        if (tileArr[id + tileAmount + 1].mine === true) count++;
        return count;
      }
      // Top right corner.
      else if (x !== 0 && y === 0) {
        if (tileArr[id - 1].mine === true) count++;
        if (tileArr[id + tileAmount].mine === true) count++;
        if (tileArr[id + tileAmount - 1].mine === true) count++;
        return count;
      }
      // Bottom left corner.
      else if (y !== 0 && x === 0) {
        if (tileArr[id - tileAmount].mine === true) count++;
        if (tileArr[id - 1].mine === true) count++;
        if (tileArr[id - tileAmount + 1].mine === true) count++;
        return count;
      }
      // Bottom right corner.
      else {
        if (tileArr[id - tileAmount].mine === true) count++;
        if (tileArr[id - tileAmount - 1].mine === true) count++;
        if (tileArr[id - 1].mine === true) count++;
        return count;
      }
    }

    function checkNearbyEmpty(id: number, arr: Tile[]) {
      // Checks left tile.
      if (
        arr[id - 1] &&
        arr[id].position.x !== 0 &&
        arr[id - 1].mine === false &&
        arr[id - 1].clicked === false
      ) {
        arr[id - 1].clicked = true;
        if (arr[id - 1].count === 0) checkNearbyEmpty(id - 1, arr);
      }
      // Checks right tile.
      if (
        arr[id + 1] &&
        arr[id].position.x !== max &&
        arr[id + 1].mine === false &&
        arr[id + 1].clicked === false
      ) {
        arr[id + 1].clicked = true;
        if (arr[id + 1].count === 0) checkNearbyEmpty(id + 1, arr);
      }
      // Checks tile above.
      if (
        arr[id - tileAmount] &&
        arr[id].position.y !== 0 &&
        arr[id - tileAmount].mine === false &&
        arr[id - tileAmount].clicked === false
      ) {
        arr[id - tileAmount].clicked = true;
        if (arr[id - tileAmount].count === 0)
          checkNearbyEmpty(id - tileAmount, arr);
      }
      // Checks tile below.
      if (
        arr[id + tileAmount] &&
        arr[id].position.y !== max &&
        arr[id + tileAmount].mine === false &&
        arr[id + tileAmount].clicked === false
      ) {
        arr[id + tileAmount].clicked = true;
        if (arr[id + tileAmount].count === 0)
          checkNearbyEmpty(id + tileAmount, arr);
      }
      // Checks upper left tile.
      if (
        arr[id - tileAmount - 1] &&
        arr[id].position.y !== 0 &&
        arr[id].position.x !== 0 &&
        arr[id - tileAmount - 1].mine === false &&
        arr[id - tileAmount - 1].clicked === false
      ) {
        arr[id - tileAmount - 1].clicked = true;
        if (arr[id - tileAmount - 1].count === 0)
          checkNearbyEmpty(id - tileAmount - 1, arr);
      }
      // Checks upper right tile.
      if (
        arr[id - tileAmount + 1] &&
        arr[id].position.y !== 0 &&
        arr[id].position.x !== max &&
        arr[id - tileAmount + 1].mine === false &&
        arr[id - tileAmount + 1].clicked === false
      ) {
        arr[id - tileAmount + 1].clicked = true;
        if (arr[id - tileAmount + 1].count === 0)
          checkNearbyEmpty(id - tileAmount + 1, arr);
      }
      // Checks lower left tile.
      if (
        arr[id + tileAmount - 1] &&
        arr[id].position.y !== max &&
        arr[id].position.x !== 0 &&
        arr[id + tileAmount - 1].mine === false &&
        arr[id + tileAmount - 1].clicked === false
      ) {
        arr[id + tileAmount - 1].clicked = true;
        if (arr[id + tileAmount - 1].count === 0)
          checkNearbyEmpty(id + tileAmount - 1, arr);
      }
      // Checks lower right tile.
      if (
        arr[id + tileAmount + 1] &&
        arr[id].position.y !== max &&
        arr[id].position.x !== max &&
        arr[id + tileAmount + 1].mine === false &&
        arr[id + tileAmount + 1].clicked === false
      ) {
        arr[id + tileAmount + 1].clicked = true;
        if (arr[id + tileAmount + 1].count === 0)
          checkNearbyEmpty(id + tileAmount + 1, arr);
      }
      return arr;
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

