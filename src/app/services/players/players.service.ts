import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, tap, map } from 'rxjs/operators';

import { Player, RawPlayer } from '../../types';
import { PlayersApiService } from '../players-api/players-api.service';
import { StorageService } from '../storage/storage.service';
import { MessageService } from '../message/message.service';
import { NotificationService } from '../notification/notification.service';
import { PlayerNamePipe } from 'src/app/modules/player-fullname.pipe';

import * as PlayersList from '../../../assets/data/players.json';
import { UtilsService } from '../../modules/utils';

const STORAGE_NAME = 'ssbu-players';
const MOCK_PLAYERS: Player[] = (PlayersList as any).default;

@Injectable({
  providedIn: 'root'
})
export class PlayersService {
  constructor(
    protected storageService: StorageService,
    private readonly utils: UtilsService,
    private readonly http: HttpClient,
    private playersApiService: PlayersApiService,
    private notificationService: NotificationService,
    private playerNamePipe: PlayerNamePipe
  ) {
    this.getPlayers();
  }

  private playersUrl = 'http://localhost:4000/api'; // URL to web api

  httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };

  private readonly playersSubject = new BehaviorSubject<Player[]>([]);
  players$ = this.playersSubject.asObservable();

  // private readonly playersSetSubject = new BehaviorSubject<Player[]>([]);
  // playersSet$ = this.playersSetSubject.asObservable();

  // private _makePlayer(player: RawPlayer): Player {
  //   const playerMeta = {
  //     id: 0,
  //     fullname: player.team + ' | ' + player.name
  //   };

  //   return { ...playerMeta, ...player };
  // }

  getPlayers(): void {
    this.playersApiService.getPlayers().subscribe(
      players => {
        this.playersSubject.next(players);
      },
      err => {
        this.notificationService.notify(`Couldn't fetch players.`, 'Dismiss');
      }
    );
  }

  getPlayer(id: number): void {}

  updatePlayer(player: Player): void {
    this.playersApiService.updatePlayer(player).subscribe(data => {
      this.getPlayers();
    });
  }

  /** POST: add a new player to the db */
  addPlayer(player: Player): void {
    this.playersApiService.addPlayer(player).subscribe(data => {
      this.playersSubject.next([...this.playersSubject.value, data]);
      this.notificationService.notify(
        `"${this.playerNamePipe.transform(
          player.name,
          player.team
        )}" has been added.`,
        'OK'
      );
    });
  }

  /** DELETE: delete the player from the db */
  deletePlayer(player: Player): void {
    this.playersApiService.deletePlayer(player._id).subscribe(data => {
      this.notificationService.notify(
        `"${this.playerNamePipe.transform(
          player.name,
          player.team
        )}" has been deleted.`,
        'OK'
      );
      this.getPlayers();
    });
  }

  initPlayers(): void {
    this.storageService.set(STORAGE_NAME, MOCK_PLAYERS);
    this.getPlayers();
  }

  resetPlayers(): void {
    this.storageService.remove(STORAGE_NAME);
    this.playersSubject.next([]);
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      // TODO: send the error to remote logging infrastructure
      console.error(error); // log to console instead

      // TODO: better job of transforming error for user consumption
      // this.log(`${operation} failed: ${error.message}`);

      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }
}
