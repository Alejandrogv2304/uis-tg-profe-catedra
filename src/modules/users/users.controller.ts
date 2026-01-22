import { Body, Controller, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('api/v1/users')
export class UsersController {
    constructor(
        private readonly usersService: UsersService
    ){}

    //Controlador para el método de creación de usuario
    @Post()
    async createUser(
        @Body() createUserDto: CreateUserDto
    ){
        return this.usersService.createUser(createUserDto);
    }
}
