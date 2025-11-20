import { All, Body, Controller, Param, Req, UploadedFile, UseInterceptors } from '@nestjs/common';
import { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProxyService } from './proxy.service';

@Controller('proxy')
export class ProxyController {
constructor(private readonly proxyService: ProxyService) {}

  @All(':service/*path')
  @UseInterceptors(FileInterceptor('image'))
  async forwardRequest(
    @Param('service') service: string,
    @Param('path') path: string,
    @Req() req: Request,
    @Body() body: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const method = req.method;
    const query = req.query;
    const headers = req.headers;

    return this.proxyService.forwardRequest(service, path, method, query, body, headers, file);
  }

  @All(':service')
  @UseInterceptors(FileInterceptor('image'))
  async forwardRequestNoPath(
    @Param('service') service: string,
    @Req() req: Request,
    @Body() body: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const method = req.method;
    const query = req.query;
    const headers = req.headers;

    return this.proxyService.forwardRequest(service, '', method, query, body, headers, file);
  }
}
