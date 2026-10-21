import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
 private readonly logger=new Logger(HttpExceptionFilter.name);
 catch(exception:unknown,host:ArgumentsHost){const ctx=host.switchToHttp(),response=ctx.getResponse<Response>(),request=ctx.getRequest<Request>();const status=exception instanceof HttpException?exception.getStatus():HttpStatus.INTERNAL_SERVER_ERROR;const payload=exception instanceof HttpException?exception.getResponse():{message:'Internal server error'};const message=typeof payload==='string'?payload:(payload as {message?:string|string[]}).message||'Request failed';if(status>=500)this.logger.error(`${request.method} ${request.url} ${status}`,exception instanceof Error?exception.stack:undefined);response.status(status).json({statusCode:status,message,path:request.url,timestamp:new Date().toISOString()});}
}
