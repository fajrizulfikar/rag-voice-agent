import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole, User } from '../../entities/user.entity';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;
  let context: ExecutionContext;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as any;
    guard = new RolesGuard(reflector);

    context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn(),
      }),
    } as any;
  });

  describe('canActivate', () => {
    it('should return true when no roles are required', () => {
      // Arrange
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
    });

    it('should return false when user is not present in request', () => {
      // Arrange
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([UserRole.ADMIN]);
      jest
        .spyOn(context.switchToHttp().getRequest(), 'call')
        .mockReturnValue({});

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(false);
    });

    it('should return true when user has required role', () => {
      // Arrange
      const mockUser: User = {
        id: '1',
        username: 'admin',
        email: 'admin@test.com',
        role: UserRole.ADMIN,
        isActive: true,
      } as User;

      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([UserRole.ADMIN]);
      jest
        .spyOn(context.switchToHttp().getRequest(), 'call')
        .mockReturnValue({ user: mockUser });

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when user does not have required role', () => {
      // Arrange
      const mockUser: User = {
        id: '1',
        username: 'user',
        email: 'user@test.com',
        role: UserRole.USER,
        isActive: true,
      } as User;

      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([UserRole.ADMIN]);
      jest
        .spyOn(context.switchToHttp().getRequest(), 'call')
        .mockReturnValue({ user: mockUser });

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(false);
    });

    it('should return true when user has one of multiple required roles', () => {
      // Arrange
      const mockUser: User = {
        id: '1',
        username: 'user',
        email: 'user@test.com',
        role: UserRole.USER,
        isActive: true,
      } as User;

      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([UserRole.USER, UserRole.ADMIN]);
      jest
        .spyOn(context.switchToHttp().getRequest(), 'call')
        .mockReturnValue({ user: mockUser });

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
    });
  });
});
