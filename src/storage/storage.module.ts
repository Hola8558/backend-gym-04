import { Global, Module } from '@nestjs/common';
import { OBJECT_STORAGE } from './constants/object-storage.token';
import { R2ObjectStorageService } from './r2-object-storage.service';

@Global()
@Module({
  providers: [
    {
      provide: OBJECT_STORAGE,
      useClass: R2ObjectStorageService,
    },
  ],
  exports: [OBJECT_STORAGE],
})
export class StorageModule {}
