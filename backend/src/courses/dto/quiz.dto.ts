import { IsString, IsNotEmpty, IsOptional, IsInt, IsBoolean, Min, Max, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class QuizChoiceDto {
  @ApiPropertyOptional({ description: 'معرف الخيار (في حال التعديل)' })
  @IsString()
  @IsOptional()
  id?: string;

  @ApiProperty({ description: 'نص الخيار', example: 'الشمعة المعاكسة الأخيرة قبل اندفاع السيولة الحاد' })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiProperty({ description: 'هل هذا الخيار هو الإجابة الصحيحة؟', example: true })
  @IsBoolean()
  isCorrect: boolean;
}

export class QuizQuestionDto {
  @ApiPropertyOptional({ description: 'معرف السؤال (في حال التعديل)' })
  @IsString()
  @IsOptional()
  id?: string;

  @ApiProperty({ description: 'نص السؤال', example: 'ما هو التعريف الفني لكتلة الأوامر المؤسسية Bullish Order Block؟' })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiPropertyOptional({ description: 'ترتيب السؤال في الاختبار', default: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  orderIndex?: number;

  @ApiPropertyOptional({ description: 'نقاط السؤال', default: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  points?: number;

  @ApiPropertyOptional({ description: 'شرح تعليمي يظهر بعد إجابة الطالب لترسيخ المفهوم' })
  @IsString()
  @IsOptional()
  explanation?: string;

  @ApiProperty({ description: 'خيارات الإجابة للسؤال', type: [QuizChoiceDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizChoiceDto)
  choices: QuizChoiceDto[];
}

export class CreateQuizDto {
  @ApiProperty({ description: 'عنوان الاختبار التقييمي', example: 'اختبار تثبيت المفاهيم: كتل الأوامر وفجوات القيمة العادلة FVG' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: 'وصف أو تعليمات الاختبار' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'النسبة المئوية المطلوبة لاجتياز الاختبار بنجاح (افتراضي 70%)', example: 70, default: 70 })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  passingScore?: number;

  @ApiPropertyOptional({ description: 'الحد الأقصى لعدد المحاولات المسموح بها للطالب', example: 3, default: 3 })
  @IsInt()
  @Min(1)
  @IsOptional()
  maxAttempts?: number;

  @ApiPropertyOptional({ description: 'أسئلة الاختبار والخيارات', type: [QuizQuestionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizQuestionDto)
  @IsOptional()
  questions?: QuizQuestionDto[];
}

export class SubmitQuizAnswersDto {
  @ApiProperty({
    description: 'إجابات الطالب بتحديد معرف السؤال ومعرف الخيار المختار',
    example: [
      { questionId: 'q_1', choiceId: 'c_2' },
      { questionId: 'q_2', choiceId: 'c_4' }
    ]
  })
  @IsArray()
  answers: { questionId: string; choiceId: string }[];
}
