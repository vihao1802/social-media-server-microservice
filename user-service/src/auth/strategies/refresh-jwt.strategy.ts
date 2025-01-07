import { ConfigType } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import jwtConfig from "../config/jwt.config";
import { AuthJwtPayload } from "../types/jwt-payload";
import { Inject, Injectable } from "@nestjs/common";
import refreshJwtConfig from "../config/refresh-jwt.config";
import { UserService } from "src/user/user.service";
import { UnauthorizedException } from "src/exception-handler/unauthorized.exception";
import { ErrorCodes } from "src/exception-handler/error-code.constant";

@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(Strategy, 'refresh-jwt') {
    constructor(@Inject(refreshJwtConfig.KEY) private refreshJwtConfiguration: ConfigType<typeof refreshJwtConfig>, private readonly userService: UserService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: refreshJwtConfiguration.secret,
        });
    }

    async validate(payload: AuthJwtPayload) {
        const user = await this.userService.findOne(payload.sub);
        if (!user) throw new UnauthorizedException(ErrorCodes.UnauthorizedCode.USER_NOT_FOUND);
        return user;
    }
}