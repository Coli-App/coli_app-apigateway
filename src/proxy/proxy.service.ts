import { HttpService } from '@nestjs/axios';
import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import FormData = require('form-data');

@Injectable()
export class ProxyService {
  private readonly serviceUrls: Record<string, string>;

  constructor(private readonly http: HttpService) {
    const authServiceUrl = process.env.AUTH_SERVICE_URL;
    const usersServiceUrl = process.env.USERS_SERVICE_URL;
    const spacesServiceUrl = process.env.SPACES_SERVICE_URL;
    const sportsServiceUrl = process.env.SPORTS_SERVICE_URL;

    if (!authServiceUrl || !usersServiceUrl || !spacesServiceUrl || !sportsServiceUrl) {
      throw new InternalServerErrorException(
        'Required service URL environment variables are not defined.',
      );
    }

    this.serviceUrls = {
      auth: authServiceUrl,
      user: usersServiceUrl,
      spaces: spacesServiceUrl,
      sports: sportsServiceUrl,
    };
  }

  async forwardRequest(
    service: string,
    path: string,
    method: string,
    query: any,
    data?: any,
    headers?: Record<string, any>,
    file?: Express.Multer.File,
  ) {
    const baseUrl = this.serviceUrls[service];

    if (!baseUrl) {
      throw new NotFoundException(
        `Cannot process request. Service '${service}' not found.`,
      );
    }

    const url = path ? `${baseUrl}/${Array.isArray(path) ? path.join('/') : path}` : baseUrl; 

    let requestHeaders = this.filterHeaders(headers);
    let requestData = data;

    if (file) {
      const formData = new FormData();
      
      formData.append('image', file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype,
      });
      
      if (data) {
        Object.keys(data).forEach(key => {
          const value = data[key];
          if (value !== undefined && value !== null) {
            if (Array.isArray(value) || typeof value === 'object') {
              formData.append(key, JSON.stringify(value));
            } 
            else {
              formData.append(key, String(value));
            }
          }
        });
      }
      
      requestData = formData;
      
      const formHeaders = formData.getHeaders();
      requestHeaders = {
        ...requestHeaders,
        ...formHeaders,
      };
      

      delete requestHeaders['content-type'];
      
      console.log('FormData created with file:', file.originalname);
    } else if (data && typeof data.getHeaders === 'function') {
      const formHeaders = data.getHeaders();
      
      requestHeaders = {
        ...requestHeaders,
        ...formHeaders,
      };

      console.log('FormData Headers generated:', formHeaders);
    }

    console.log(`Gateway redirection:`, {
      service,
      baseUrl,
      path,
      finalUrl: url,
      method,
      pathType: typeof path,
      pathLength: Array.isArray(path) ? path.length : 'not array'
    });

    try {
      const response = await firstValueFrom(
        this.http.request({
          method,
          url,
          params: query,
          headers: requestHeaders,
          ...(requestData && Object.keys(requestData).length > 0 &&
            !['GET', 'DELETE'].includes(method) && { data: requestData }),
        }),
      );
      
      console.log(`Proxy Success:`, {
        status: response.status,
        dataType: typeof response.data
      });
      
      return response.data;
    } catch (error) {
      console.error(`Proxy Error:`, {
        message: error.message,
        isAxiosError: error instanceof AxiosError,
        hasResponse: error.response ? true : false,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method
        }
      });
      
      if (error instanceof AxiosError && error.response) {
        throw new HttpException(error.response.data, error.response.status);
      }
      throw new HttpException('Internal server error', 500);
    }
  }

  private filterHeaders(
    headers: Record<string, any> = {},
  ): Record<string, string> {
    const allowedHeaders = ['authorization', 'content-type'];
    const filtered: Record<string, string> = {};

    for (const [key, value] of Object.entries(headers)) {
      if (allowedHeaders.includes(key.toLowerCase())) {
        filtered[key] = String(value);
      }
    }

    return filtered;
  }
} 
