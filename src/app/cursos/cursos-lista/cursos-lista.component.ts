import { AlertModalService } from './../../shared/alert-modal.service';
import { Component, OnInit, ViewChild } from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { Observable, of, Subject, EMPTY } from 'rxjs';
import { catchError, take, switchMap, isEmpty } from 'rxjs/operators';
// import { CursosService } from './../cursos.service';
import { Cursos2Service } from '../cursos2.service';
import { Curso } from './../models/curso';
import { AlertModalComponent } from './../../shared/alert-modal/alert-modal.component'; // nao esquecer de declarar no sharedModule exports
import { ActivatedRoute, Router } from '@angular/router';


@Component({
  selector: 'app-cursos-lista',
  templateUrl: './cursos-lista.component.html',
  styleUrls: ['./cursos-lista.component.scss'],
  preserveWhitespaces: true
})
// preserveWhitespaces faz com que
// o espaço de  quebra de linha no html
// seja respeitado

export class CursosListaComponent implements OnInit {

  // a variavel cursos esta sendo criada no html -> ! async as cursos
  // cursos: Curso[] | undefined;

  // o recurso de utilizar o $ como sufixo
  // para indicar um observable chama-se notação filandesa
  cursos$: Observable<Curso[]> | undefined;
  error$ = new Subject<boolean>();
  bsModalRef: BsModalRef | undefined;
  nonErrorThrown = true;
  deleteModalRef: BsModalRef | undefined;

  // permite fazer referencia ao elemento da view => referencia ng-template #deleteModal no html
  @ViewChild('deleteModal') deleteModal: any;

  // é necessário para guardar a informação e utilizar depois do popup de exclusao
  cursoSelecionado: Curso | undefined;
// service: CursosService
  constructor(private service: Cursos2Service,
              private modalService: BsModalService,
              private alertService: AlertModalService,
              private router: Router, private route: ActivatedRoute) { }

  // tslint:disable-next-line: typedef
  ngOnInit() {
    // subsituido pelo cursos$
    // this.service.list()
    //   .subscribe((dados: any) => this.cursos = dados);
    this.onRefresh();
  }

  onRefresh(): void {
    this.cursos$ = this.service.list()
      .pipe(
        // o catch error deve ser sempre o ultimo operador do pipe caso esteja usando mais de um
        // exemplo um map ou tap etc
        catchError(error => {
          console.error(error);
          // this.error$.next(true); // next emite o valor
          this.handleError(); // pode ser criado um metodo para tratar o erro
          return of();
        })
      );
  }
  // exemplo de subscribe usando os tres parametros da funcao:
  // 1 - sucess, 2 - error, 3 - complete
  // exemploSubscribe(): void {
  //   // pode usar o pipe subsituiindo os dois ultimos parametros do subscribe
  //   this.service.list()
  //     .pipe(
  //       catchError(error => {
  //         console.error(error);
  //         this.error$.next(true);
  //         return of();
  //       })
  //     )
  //     .subscribe(
  //       (dados: any) => {
  //         console.log(dados);
  //       },
  //       // (error: any) => console.error(error),
  //       // () => console.log('Observable completo')
  //     );
  // }

  handleError(): void {
    // note que o AlertModalComponent não tem instancia ou seja é criado em tempo de execucao
    // sempre que houver este tipo de situacao é necessario informar ao angular por
    // meio do entryComponents que no caso é declarado no shared module, pois o
    // AlertModalComponent não possui um template ou roteamento que o utilize
    // quando utilizar o entryComponents é necessário importar o modulo (sharedmodule) no appmodule
    this.nonErrorThrown = false;
    /*this.bsModalRef = this.modalService.show(AlertModalComponent);
    this.bsModalRef.content.type = 'danger';
    this.bsModalRef.content.message = 'Erro ao carregar cursos. Tente novamente mais tarde.';*/
    this.alertService.showAlertDanger('Erro ao carregar cursos. Tente novamente mais tarde.');
  }

  onEdit(id: number): void {
    this.router.navigate(['editar', id], { relativeTo: this.route });
  }

  onDelete(curso: Curso): void {
    this.cursoSelecionado = curso;
    // this.deleteModalRef = this.modalService.show(this.deleteModal, { class: 'modal-sm' });
    const result$ = this.alertService.showConfirm('Confirmação', 'Tem certeza que deseja remover esse curso?');
    result$.asObservable()
    .pipe(
      take(1),
      switchMap( result => result ? this.service.remove(curso.id) : EMPTY )
    )
    // tslint:disable-next-line: deprecation
    .subscribe(
      (success: any) => {
        this.onRefresh();
      },
      (error: any) => {
        this.alertService.showAlertDanger('Erro ao remover curso. Tente novamente mais tarde.');
      }
    );

  }

  onConfirmDelete(): void {
    this.service.remove(this.cursoSelecionado?.id)
    .subscribe(
      (success: any) => this.onRefresh(),
      (error: any) => {
        this.alertService.showAlertDanger('Erro ao remover curso. Tente novamente mais tarde.');
        this.deleteModalRef?.hide();
      },
      (completed: any) => {
        console.log('Request completed');
        this.deleteModalRef?.hide();
      }
    );
  }

  onDeclineDelete(): void {
    this.deleteModalRef?.hide();
  }

}
