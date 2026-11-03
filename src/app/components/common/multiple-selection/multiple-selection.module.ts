import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MultipleSelectionComponent } from './multiple-selection.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MultipleSelectionService } from './multipleSelectionSelection';

@NgModule({
  declarations: [MultipleSelectionComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatIconModule,
    MatAutocompleteModule
  ],
  providers: [MultipleSelectionService],
  exports: [
    MultipleSelectionComponent
  ]
})
export class MultipleSelectionModule { }
