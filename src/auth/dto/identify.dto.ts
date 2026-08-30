import { PickType } from '@nestjs/swagger';
import { LoginDto } from './login.dto';

export class IdentifyDto extends PickType(LoginDto, ['identifier'] as const) {}
