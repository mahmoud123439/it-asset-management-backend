import { CanActivate, ExecutionContext, Injectable, SetMetadata, UnauthorizedException, ForbiddenException, createParamDecorator } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { Role } from './entities';
export const Roles=(...roles:Role[])=>SetMetadata('roles',roles);
export const CurrentUser=createParamDecorator((_d:unknown,ctx:ExecutionContext)=>ctx.switchToHttp().getRequest<Request & {user:{sub:string;email:string;role:Role}}>().user);
@Injectable() export class JwtGuard implements CanActivate { constructor(private jwt:JwtService){} canActivate(ctx:ExecutionContext):boolean { const req=ctx.switchToHttp().getRequest<Request & {user?:unknown}>(); const token=req.headers.authorization?.replace(/^Bearer\s+/,''); if(!token)throw new UnauthorizedException(); try{req.user=this.jwt.verify(token,{secret:process.env.JWT_ACCESS_SECRET});return true;}catch{throw new UnauthorizedException('Session expired');} } }
@Injectable() export class RoleGuard implements CanActivate { constructor(private reflector:Reflector){} canActivate(ctx:ExecutionContext):boolean { const roles=this.reflector.getAllAndOverride<Role[]>('roles',[ctx.getHandler(),ctx.getClass()]);if(!roles?.length)return true;const user=ctx.switchToHttp().getRequest<Request & {user:{role:Role}}>().user;if(!roles.includes(user.role))throw new ForbiddenException();return true;} }
