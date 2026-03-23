'use client';

import type { SupabaseClient } from '@supabase/supabase-js';

const DEFAULT_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'profile-photos';

function sanitizeFileName(fileName: string) {
  const extension = fileName.includes('.') ? fileName.split('.').pop() : 'jpg';
  const baseName = fileName.replace(/\.[^/.]+$/, '');

  return `${baseName}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .concat(`.${extension || 'jpg'}`);
}

function extractStoragePath(url: string, bucket = DEFAULT_BUCKET) {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const index = url.indexOf(marker);

  if (index === -1) {
    return null;
  }

  return decodeURIComponent(url.slice(index + marker.length));
}

export async function uploadProfilePhoto(params: {
  supabase: SupabaseClient;
  userId: string;
  file: File;
  previousUrl?: string;
  bucket?: string;
}) {
  const { supabase, userId, file, previousUrl, bucket = DEFAULT_BUCKET } = params;
  const filePath = `${userId}/${Date.now()}-${sanitizeFileName(file.name)}`;

  const { error } = await supabase.storage.from(bucket).upload(filePath, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type,
  });

  if (error) {
    throw error;
  }

  if (previousUrl) {
    const previousPath = extractStoragePath(previousUrl, bucket);

    if (previousPath && previousPath !== filePath) {
      await supabase.storage.from(bucket).remove([previousPath]);
    }
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(filePath);

  return {
    bucket,
    filePath,
    publicUrl,
  };
}
