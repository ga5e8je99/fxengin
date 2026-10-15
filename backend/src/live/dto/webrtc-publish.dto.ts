import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class WebRtcPublishSignalDto {
  @ApiProperty({
    description: 'عرض بروتوكول وصف الجلسة (SDP Offer) المولد من متصفح المحاضر عبر RTCPeerConnection',
    example: 'v=0\r\no=- 4611731400430051336 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n...',
  })
  @IsNotEmpty({ message: 'حقل الـ sdp إلزامي لإتمام مصافحة WebRTC' })
  @IsString({ message: 'حقل الـ sdp يجب أن يكون نصاً صالحاً' })
  sdp: string;
}
