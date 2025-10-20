import { All, Body, Controller, Param, Req } from '@nestjs/common';
import { Request } from 'express';
import { ProxyService } from './proxy.service';

@Controller('proxy')
export class ProxyController {
constructor(private readonly proxyService: ProxyService) {}

  @All(':service/*path')
  async forwardRequest(
    @Param('service') service: string,
    @Param('path') path: string,
    @Req() req: Request,
    @Body() body: any,
  ) {
    const method = req.method;
    const query = req.query;
    const headers = req.headers;

    return this.proxyService.forwardRequest(service, path, method, query, body, headers);
  }

  @All(':service')
  async forwardRequestNoPath(
    @Param('service') service: string,
    @Req() req: Request,
    @Body() body: any,
  ) {
    const method = req.method;
    const query = req.query;
    const headers = req.headers;

    return this.proxyService.forwardRequest(service, '', method, query, body, headers);
  }
}
