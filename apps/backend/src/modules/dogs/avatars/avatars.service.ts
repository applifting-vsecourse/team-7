import {
  BadRequestException,
  FileTypeValidator,
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { PrismaService } from "@/core/prisma/prisma.service";
import type { DogDetails } from "@/modules/dogs/domain/dog-details";
import { AVATAR_UPLOAD_LIMIT } from "./avatars.constants";

@Injectable()
export class DogAvatarsService {
  private readonly imageTypeValidator = new FileTypeValidator({
    fileType: /^image\/(jpeg|png|webp)$/,
    overrideMimeType: true,
  });

  constructor(private readonly prisma: PrismaService) {}

  async prepareAvatar(input: Buffer) {
    await this.validateAvatar(input);
    return { avatar: new Uint8Array(input), avatarVersion: randomUUID() };
  }

  async getAvatar(userId: string, id: string) {
    const dog = await this.prisma.dog.findFirst({
      where: { id, userId },
      select: { avatar: true, avatarVersion: true },
    });
    if (!dog?.avatar || !dog.avatarVersion)
      throw new NotFoundException("Avatar not found");
    const bytes = Buffer.from(dog.avatar);
    const mimeType = await this.validateAvatar(bytes);
    return { bytes, version: dog.avatarVersion, mimeType };
  }

  async uploadAvatar(
    userId: string,
    id: string,
    input: Buffer | undefined,
  ): Promise<DogDetails> {
    const owned = await this.prisma.dog.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!owned) throw new NotFoundException("Dog not found");
    if (!input?.length) throw new BadRequestException("A photo is required");
    const data = await this.prepareAvatar(input);
    const [dog] = await this.prisma.dog.updateManyAndReturn({
      where: { id, userId },
      data,
      omit: { avatar: true },
    });
    if (!dog) throw new NotFoundException("Dog not found");
    return dog;
  }

  async removeAvatar(userId: string, id: string): Promise<DogDetails> {
    const [dog] = await this.prisma.dog.updateManyAndReturn({
      where: { id, userId },
      data: { avatar: null, avatarVersion: null },
      omit: { avatar: true },
    });
    if (!dog) throw new NotFoundException("Dog not found");
    return dog;
  }

  /** Detect the MIME type from file signatures without decoding image pixels. */
  private async validateAvatar(input: Buffer): Promise<string> {
    if (input.length > AVATAR_UPLOAD_LIMIT) {
      throw new PayloadTooLargeException("Avatar must be at most 100 KB");
    }
    const file = {
      buffer: input,
      size: input.length,
      mimetype: "application/octet-stream",
    };
    if (!(await this.imageTypeValidator.isValid(file))) {
      throw new BadRequestException("Choose a valid JPEG, PNG or WebP avatar.");
    }
    return file.mimetype;
  }
}
