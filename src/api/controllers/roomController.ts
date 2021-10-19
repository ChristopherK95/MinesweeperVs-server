import { Server, Socket } from "socket.io";
import { ConnectedSocket, MessageBody, OnMessage, SocketController, SocketIO } from "socket-controllers";
import { ClientsDB, Player } from "../../data/players";
import {Rooms, Room, Settings} from "../../data/rooms";

@SocketController()
export class RoomController {

  @OnMessage("create_game")
  public async createGame(@SocketIO() io: Server, @ConnectedSocket() socket: Socket, @MessageBody() message: any) {
    if (io.sockets.adapter.rooms.has(message.roomId)) {
      var code: string;
      while (true) {
        code = "";
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        for (let i = 0; i < 5; i++) {
          let randomChar = characters.charAt(Math.floor(Math.random() * characters.length));
          code += randomChar;
        }
        if (!io.sockets.adapter.rooms.has(code)) {
          message.roomId = code;
          break;
        }
      }
    }
    const roomId: string = message.roomId;
    const settings: Settings = {
      tileAmount: 12,
      totalBombs: 50,
      roundTimeSetting: 30
    }
    const players: string[] = [];
    players.push(socket.id)
    const room: Room = {roomId, settings, players};
    Rooms.setRoom(room)
    let player: Player = { name: message.name, score: 0, id: socket.id };
    ClientsDB.setPlayer(player);
    await socket.join(message.roomId);
    socket.emit("room_created", player);
  }

  @OnMessage("join_game")
  public async joinGame(@SocketIO() io: Server, @ConnectedSocket() socket: Socket, @MessageBody() message: any) {
    if (!io.sockets.adapter.rooms.has(message.roomId)) {
      socket.emit("room_join_error", {
        error: "Room doesn't exist"
      });
      return;
    }
    Rooms.getRoom(message.roomId).players.push(socket.id);
    const settings: Settings = Rooms.getSettings(message.roomId)
    const connectedSockets = io.sockets.adapter.rooms.get(message.roomId);
    const socketRooms = Array.from(socket.rooms.values()).filter((r) => r !== socket.id);

    let player: Player = { name: message.name, score: 0, id: socket.id }
    ClientsDB.setPlayer(player)

    if (socketRooms.length > 0 || connectedSockets && connectedSockets.size === 2) {
      socket.emit("room_join_error", {
        error: "Room is full"
      });
    } else {
      await socket.join(message.roomId);
      const arr = Array.from(connectedSockets!)
      var players: Player[] = [];
      players.push(ClientsDB.getPlayer(arr[0]))
      players.push(ClientsDB.getPlayer(arr[1]))
      socket.emit("room_joined", players, settings);
      socket.to(message.roomId).emit("player_two_joined", players[1]);
    }
  }

  @OnMessage("leave_room")
  public async leaveRoom(@ConnectedSocket() socket: Socket, @MessageBody() roomId: string){
    socket.leave(roomId);
  }

  @OnMessage("update_tile_amount")
  public async updateTileAmountSetting(@SocketIO() io: Server, @ConnectedSocket() socket: Socket, @MessageBody() message: any) {
    const settings: Settings = {...Rooms.getSettings(message.roomId), tileAmount: message.tileAmount};
    Rooms.setSettings(message.roomId, settings);
    socket.to(message.roomId).emit("tile_amount_update", message.tileAmount);
  }

  @OnMessage("update_bombs_setting")
  public async updateBombsSetting(@SocketIO() io: Server, @ConnectedSocket() socket: Socket, @MessageBody() message: any) {
    const settings: Settings = {...Rooms.getSettings(message.roomId), totalBombs: message.totalBombs};
    Rooms.setSettings(message.roomId, settings);
    socket.to(message.roomId).emit("bombs_setting_update", message.totalBombs);
  }

  @OnMessage("update_round_time_setting")
  public async updateRoundTimeSetting(@SocketIO() io: Server, @ConnectedSocket() socket: Socket, @MessageBody() message: any) {
    const settings: Settings = {...Rooms.getSettings(message.roomId), roundTimeSetting: message.roundTime};
    Rooms.setSettings(message.roomId, settings);
    socket.to(message.roomId).emit("round_time_setting_update", message.roundTime);
  }

  @OnMessage("start_game")
  public async startGame(@SocketIO() io: Server, @ConnectedSocket() socket: Socket, @MessageBody() message: any) {
    const room = Array.from(socket.rooms.values()).filter((r) => r !== socket.id);
    const connectedSockets = io.sockets.adapter.rooms.get(room[0]);
    const arr = Array.from(connectedSockets!);
    const turn: string = arr[Math.round(Math.random())];

    const totalBombs = message.totalBombs;
    const roundTime = message.roundTime;
    io.in(room[0]).emit("start_game", { turn, totalBombs, roundTime });
  }
}