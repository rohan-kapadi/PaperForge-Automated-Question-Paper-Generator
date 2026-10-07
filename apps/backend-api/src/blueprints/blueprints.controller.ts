import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { BlueprintsService, CreateBlueprintDto } from './blueprints.service';

@Controller('blueprints')
export class BlueprintsController {
    constructor(private readonly blueprintsService: BlueprintsService) { }

    @Get()
    findAll() {
        return this.blueprintsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.blueprintsService.findOne(id);
    }

    @Post()
    create(@Body() createBlueprintDto: CreateBlueprintDto) {
        return this.blueprintsService.create(createBlueprintDto);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateDto: Partial<CreateBlueprintDto>) {
        return this.blueprintsService.update(id, updateDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.blueprintsService.remove(id);
    }
}
