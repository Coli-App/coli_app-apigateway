import { HttpService } from '@nestjs/axios';
import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

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
      space: spacesServiceUrl,
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
  ) {
    const baseUrl = this.serviceUrls[service];

    if (!baseUrl) {
      throw new NotFoundException(
        `Cannot process request. Service '${service}' not found.`,
      );
    }

    const url = path ? `${baseUrl}/${path}` : baseUrl;

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
          headers: this.filterHeaders(headers),
          ...(data && Object.keys(data).length > 0 &&
            !['GET', 'DELETE'].includes(method) && { data }),
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
