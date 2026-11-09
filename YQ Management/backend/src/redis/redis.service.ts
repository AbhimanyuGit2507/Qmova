import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import Redis from 'ioredis';
import { Subject } from 'rxjs';

export interface PublicVisitUpdateEvent {
  visitId?: string;
  accessToken?: string;
  queueId?: string;
  tenantId?: string;
  type?: string;
}

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  public readonly client: Redis;
  public readonly subscriber: Redis;
  public readonly visitEvents$ = new Subject<PublicVisitUpdateEvent>();

  constructor() {
    const redisOptions = {
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
      // Keep retries limited to avoid noisy infinite retry logs
      maxRetriesPerRequest: 5,
      // Reconnect strategy: exponential backoff up to ~30s
      retryStrategy: (times: number) =>
        Math.min(30000, Math.pow(2, times) * 100),
      // Do not block the event loop indefinitely when offline
      enableOfflineQueue: false,
    } as any;

    this.client = new Redis(redisOptions);
    this.subscriber = new Redis(redisOptions);
  }

  onModuleInit() {
    this.client.on('connect', () => this.logger.log('Redis connected'));
    this.client.on('ready', () => this.logger.log('Redis ready'));
    this.client.on('close', () => this.logger.warn('Redis connection closed'));
    this.client.on('reconnecting', () =>
      this.logger.warn('Redis reconnecting'),
    );
    this.client.on('error', (err) => this.logger.error(`Redis Error: ${err}`));

    // Subscriber mirrors some events for better debugging
    this.subscriber.on('error', (err) =>
      this.logger.error(`Redis Subscriber Error: ${err}`),
    );
    this.subscriber.on('connect', () =>
      this.logger.log('Redis subscriber connected'),
    );

    // Subscribe to public visit updates channel
    this.subscriber.subscribe('qmova:public:visit:update', (err) => {
      if (err) {
        this.logger.error(
          `Failed to subscribe to qmova:public:visit:update: ${err}`,
        );
      } else {
        this.logger.log('Subscribed to qmova:public:visit:update channel');
      }
    });

    this.subscriber.on('message', (channel, message) => {
      if (channel === 'qmova:public:visit:update') {
        try {
          const parsed = JSON.parse(message);
          this.visitEvents$.next(parsed);
        } catch (e) {
          this.logger.warn(
            `Failed to parse message on channel ${channel}: ${e}`,
          );
        }
      }
    });
  }

  async publishVisitUpdate(event: PublicVisitUpdateEvent): Promise<number> {
    try {
      return await this.client.publish(
        'qmova:public:visit:update',
        JSON.stringify(event),
      );
    } catch (err: any) {
      this.logger.warn(
        `Failed to publish visit update to Redis: ${err?.message}`,
      );
      return 0;
    }
  }

  onModuleDestroy() {
    try {
      this.visitEvents$.complete();
      this.client.disconnect();
      this.subscriber.disconnect();
    } catch (e) {
      // Ignore disconnect errors during teardown
    }
  }
}
