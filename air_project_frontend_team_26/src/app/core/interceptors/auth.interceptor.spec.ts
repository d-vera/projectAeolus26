import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';

// Mock localStorage for the Node.js test environment
const store: Record<string, string> = {};
const mockLocalStorage = {
  getItem: (key: string): string | null => store[key] ?? null,
  setItem: (key: string, value: string): void => { store[key] = value; },
  removeItem: (key: string): void => { delete store[key]; },
  clear: (): void => { Object.keys(store).forEach(key => delete store[key]); },
  get length(): number { return Object.keys(store).length; },
  key: (index: number): string | null => Object.keys(store)[index] ?? null,
};

Object.defineProperty(globalThis, 'localStorage', { value: mockLocalStorage, writable: true });

describe('authInterceptor', () => {
  let httpClient: HttpClient;
  let httpTesting: HttpTestingController;
  let mockRouter: { navigate: ReturnType<typeof vi.fn> };
  let mockAuthService: { clearAuthData: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockRouter = { navigate: vi.fn() };
    mockAuthService = { clearAuthData: vi.fn() };

    mockLocalStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: Router, useValue: mockRouter },
        { provide: AuthService, useValue: mockAuthService },
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    mockLocalStorage.clear();
  });

  it('should add Authorization header when token exists in localStorage', () => {
    mockLocalStorage.setItem('auth_token', 'test-token-123');

    httpClient.get('/api/data').subscribe();

    const req = httpTesting.expectOne('/api/data');
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-token-123');
    req.flush({});
  });

  it('should NOT add Authorization header when no token in localStorage', () => {
    httpClient.get('/api/data').subscribe();

    const req = httpTesting.expectOne('/api/data');
    expect(req.request.headers.has('Authorization')).toBeFalsy();
    req.flush({});
  });

  it('should NOT add Authorization header for login requests', () => {
    mockLocalStorage.setItem('auth_token', 'test-token-123');

    httpClient.post('/api/auth/login', {}).subscribe();

    const req = httpTesting.expectOne('/api/auth/login');
    expect(req.request.headers.has('Authorization')).toBeFalsy();
    req.flush({});
  });

  it('should NOT add Authorization header for register requests', () => {
    mockLocalStorage.setItem('auth_token', 'test-token-123');

    httpClient.post('/api/auth/register', {}).subscribe();

    const req = httpTesting.expectOne('/api/auth/register');
    expect(req.request.headers.has('Authorization')).toBeFalsy();
    req.flush({});
  });

  it('should clear auth data and redirect to login on 401 error', () => {
    mockLocalStorage.setItem('auth_token', 'expired-token');

    httpClient.get('/api/data').subscribe({
      error: () => { /* expected */ },
    });

    const req = httpTesting.expectOne('/api/data');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(mockAuthService.clearAuthData).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(
      ['/login'],
      { queryParams: { expired: 'true' } }
    );
  });

  it('should clear auth data and redirect to login on 403 error', () => {
    mockLocalStorage.setItem('auth_token', 'forbidden-token');

    httpClient.get('/api/data').subscribe({
      error: () => { /* expected */ },
    });

    const req = httpTesting.expectOne('/api/data');
    req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });

    expect(mockAuthService.clearAuthData).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(
      ['/login'],
      { queryParams: { expired: 'true' } }
    );
  });

  it('should NOT clear auth data on other error status codes (e.g. 500)', () => {
    mockLocalStorage.setItem('auth_token', 'valid-token');

    httpClient.get('/api/data').subscribe({
      error: () => { /* expected */ },
    });

    const req = httpTesting.expectOne('/api/data');
    req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

    expect(mockAuthService.clearAuthData).not.toHaveBeenCalled();
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('should propagate the error to the subscriber', () => {
    let errorReceived = false;

    httpClient.get('/api/data').subscribe({
      error: () => { errorReceived = true; },
    });

    const req = httpTesting.expectOne('/api/data');
    req.flush('Not Found', { status: 404, statusText: 'Not Found' });

    expect(errorReceived).toBe(true);
  });

  it('should read token directly from localStorage, not from AuthService', () => {
    mockLocalStorage.setItem('auth_token', 'direct-storage-token');

    httpClient.get('/api/data').subscribe();

    const req = httpTesting.expectOne('/api/data');
    expect(req.request.headers.get('Authorization')).toBe('Bearer direct-storage-token');
    req.flush({});

    expect(mockAuthService.clearAuthData).not.toHaveBeenCalled();
  });
});
