<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('senior_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('senior_id')->constrained('seniors')->onDelete('cascade');
            $table->string('document_type');
            $table->binary('file_content');
            $table->string('file_name');
            $table->string('mime_type');
            $table->unsignedBigInteger('file_size');
            $table->timestamps();
        });
        
        // Ensure LONGBLOB for large files in MySQL
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE senior_documents MODIFY file_content LONGBLOB");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('senior_documents');
    }
};
