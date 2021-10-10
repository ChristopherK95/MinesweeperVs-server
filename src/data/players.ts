export type Player = {
  name: string;
  score: number;
  id: string;
}

export abstract class ClientsDB {
  public static clients: Player[] = [];

  public static getPlayer(id: string): Player {
    let player: Player = ClientsDB.clients.find(client => client.id === id)!;
    return player;
  }

  public static setPlayer(player: Player): void {
    ClientsDB.clients.push(player);
  }
}