"""
Utility functions for Cloudinary file uploads.
"""
import cloudinary
import cloudinary.uploader
import asyncio
import logging
from fastapi import HTTPException, status, UploadFile

from config import settings

logger = logging.getLogger(__name__)

# Configure Cloudinary
cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=str(settings.CLOUDINARY_API_SECRET),
)


async def upload_resume_to_cloudinary(
    file: UploadFile,
    user_id: str,
    job_id: str,
) -> str:
    """
    Upload a resume PDF file to Cloudinary.
    
    IMPORTANT: For PDF files to be viewable in browsers, you must enable
    "PDF and ZIP files delivery" in your Cloudinary account settings:
    1. Go to https://cloudinary.com/console
    2. Navigate to Settings > Security
    3. Enable "Allow delivery of PDF and ZIP files"
    
    Args:
        file: The uploaded file (should be PDF)
        user_id: User ID for organizing files
        job_id: Job ID for organizing files
        
    Returns:
        str: The secure URL of the uploaded file
        
    Raises:
        HTTPException: If file upload fails or file is not a PDF
    """
    # Validate file type
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File name is required"
        )
    
    # Check if file is PDF by extension and content type
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are allowed for resumes"
        )
    
    # Check content type if available
    if file.content_type and file.content_type != "application/pdf":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are allowed for resumes"
        )
    
    # Read file content
    try:
        file_content = await file.read()
        
        # Validate file size (max 10MB)
        max_size = 10 * 1024 * 1024  # 10MB
        if len(file_content) > max_size:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File size exceeds maximum limit of 10MB"
            )
        
        # Validate PDF magic bytes (PDF files start with %PDF)
        if not file_content.startswith(b'%PDF'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid PDF file format"
            )
        
        # Upload to Cloudinary (run in thread pool since cloudinary.uploader is synchronous)
        # Use public_id to organize files: job_portal/resumes/user_id/job_id/timestamp
        import time
        timestamp = int(time.time())
        public_id = f"job_portal/resumes/{user_id}/{job_id}/{timestamp}"
        
        # Run synchronous upload in thread pool
        loop = asyncio.get_event_loop()
        upload_result = await loop.run_in_executor(
            None,
            lambda: cloudinary.uploader.upload(
                file_content,
                resource_type="raw",  # Use "raw" for PDF files
                public_id=public_id,
                format="pdf",
                overwrite=False,
                type="upload",  # Ensure it's an uploaded resource (publicly accessible)
                use_filename=False,  # Use the public_id we provided
                invalidate=False,  # Don't invalidate CDN cache
            )
        )
        
        # Get secure URL - use secure_url for HTTPS access
        resume_url = upload_result.get("secure_url")
        
        if not resume_url:
            # Fallback to regular URL if secure_url is not available
            resume_url = upload_result.get("url")
        
        if not resume_url:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to get upload URL from Cloudinary. Please ensure PDF delivery is enabled in your Cloudinary account settings."
            )
        
        logger.info(f"Resume uploaded successfully: {resume_url}")
        logger.info(f"Upload result keys: {upload_result.keys()}")
        
        return resume_url
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading resume to Cloudinary: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload resume: {str(e)}"
        )


async def delete_resume_from_cloudinary(resume_url: str) -> bool:
    """
    Delete a resume PDF file from Cloudinary.
    
    Args:
        resume_url: The Cloudinary URL of the file to delete
        
    Returns:
        bool: True if deletion was successful, False otherwise
        
    Raises:
        HTTPException: If deletion fails
    """
    if not resume_url:
        logger.warning("No resume URL provided for deletion")
        return False
    
    try:
        # Extract public_id from Cloudinary URL
        # URL format: https://res.cloudinary.com/{cloud_name}/raw/upload/{version}/{public_id}.pdf
        # We need to extract the public_id part
        import re
        from urllib.parse import urlparse
        
        # Parse the URL to extract the path
        parsed_url = urlparse(resume_url)
        path_parts = parsed_url.path.split('/')
        
        # Find the index of 'upload' and get everything after it (excluding version and format)
        try:
            upload_index = path_parts.index('upload')
            # Skip version (v{number}) and get the rest as public_id
            # Remove the .pdf extension
            public_id_parts = path_parts[upload_index + 2:]  # Skip 'upload' and version
            public_id = '/'.join(public_id_parts).replace('.pdf', '')
        except (ValueError, IndexError):
            # Fallback: try to extract from the full path
            # Remove leading/trailing slashes and .pdf extension
            public_id = parsed_url.path.strip('/').replace('/raw/upload/', '').replace('.pdf', '')
            # Remove version prefix (v{number}/)
            if public_id.startswith('v'):
                public_id = '/'.join(public_id.split('/')[1:])
        
        if not public_id:
            logger.warning(f"Could not extract public_id from URL: {resume_url}")
            return False
        
        # Delete the file from Cloudinary (run in thread pool)
        loop = asyncio.get_event_loop()
        delete_result = await loop.run_in_executor(
            None,
            lambda: cloudinary.uploader.destroy(
                public_id,
                resource_type="raw",
                invalidate=True,  # Invalidate CDN cache
            )
        )
        
        if delete_result.get("result") == "ok":
            logger.info(f"Resume deleted successfully from Cloudinary: {public_id}")
            return True
        else:
            logger.warning(f"Cloudinary deletion returned: {delete_result.get('result')}")
            return False
            
    except Exception as e:
        logger.error(f"Error deleting resume from Cloudinary: {str(e)}")
        # Don't raise exception - deletion failure shouldn't block application deletion
        # Just log the error
        return False

