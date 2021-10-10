import { Player } from "./players";

export type Room = {
  roomId: string;
  settings: Settings;
  players: string[];
}

export type Settings = {
  tileAmount: number;
  totalBombs: number;
  roundTimeSetting: number;
}

export abstract class Rooms {
  public static rooms: Room[] = [];

  public static getRoom(roomId: string): Room {
    return Rooms.rooms.find(r => r.roomId === roomId)!
  }
  
  public static getRoomByPlayer(playerId: string): Room {
    return Rooms.rooms.find(r => r.players.includes(playerId))!;
  }

  public static setRoom(room: Room): void {
    this.rooms.push(room);
  }

  public static getSettings(roomId: string): Settings {
    return Rooms.rooms.find(r => r.roomId === roomId)!.settings
  }

  public static setSettings(roomId: string, settings: Settings): void {
    this.getRoom(roomId).settings = settings;
  }
}