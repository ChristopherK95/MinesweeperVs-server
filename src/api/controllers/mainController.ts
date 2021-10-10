import { ConnectedSocket, OnConnect, SocketController, SocketIO } from "socket-controllers";
import { Socket, Server } from "socket.io";
import {Rooms, Room, Settings} from "../../data/rooms";

@SocketController()
export class MainController {
  @OnConnect()
  public onConnection(@ConnectedSocket() socket: Socket, @SocketIO() io: Server) {
    console.log("New Socket Connected: ", socket.id);

    socket.on("custom_event", (data: any) => {
      console.log("Data: ", data);
    })

    socket.on("disconnect", () => {
      const room = Rooms.getRoomByPlayer(socket.id);
      if(room){
        socket.to(room.roomId).emit("disconnected");
      }
    })
  }
}