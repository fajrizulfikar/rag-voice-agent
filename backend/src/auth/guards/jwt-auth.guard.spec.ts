import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;
  let context: ExecutionContext;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as any;
    guard = new JwtAuthGuard(reflector);

    context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn(),
      }),
    } as any;
  });

  describe('canActivate', () => {
    it('should return true for public routes', () => {
      // Arrange
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
    });

    it('should call super.canActivate for protected routes', () => {
      // Arrange
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      const superCanActivateSpy = jest.spyOn(
        Object.getPrototypeOf(JwtAuthGuard.prototype),
        'canActivate',
      );
      superCanActivateSpy.mockReturnValue(true);

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(superCanActivateSpy).toHaveBeenCalledWith(context);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
    });

    it('should call super.canActivate when isPublic is undefined', () => {
      // Arrange
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
      const superCanActivateSpy = jest.spyOn(
        Object.getPrototypeOf(JwtAuthGuard.prototype),
        'canActivate',
      );
      superCanActivateSpy.mockReturnValue(true);

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(superCanActivateSpy).toHaveBeenCalledWith(context);
    });
  });
});
