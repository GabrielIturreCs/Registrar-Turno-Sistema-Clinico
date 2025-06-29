/* tslint:disable:no-unused-variable */

import { TestBed,  inject } from '@angular/core/testing';
import { ChatbotService } from './ChatBot.service.spec; // Adjust the import path as necessary
describe('Service: ChatBot', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ChatbotService]
    });
  });

  it('should ...', inject([ChatbotService], (service: ChatbotService) => {
    expect(service).toBeTruthy();
  }));
});
