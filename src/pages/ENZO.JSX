import React from 'react'

const ENZO = () => {
const TemplatePreview = ({ 
    template, 
    coordinates, 
    student, 
    previewWidth = 700, 
    previewHeight = 500 
}) => {
    const [frontPreview, setFrontPreview] = useState(null);
    const [studentPhoto, setStudentPhoto] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadPreview = async () => {
            setLoading(true);
            setError(null);
            try {
                if (template?.frontSide?.filename) {
                    const frontUrl = await templateAPI.previewTemplate(template.frontSide.filename);
                    setFrontPreview(frontUrl);
                    
                    // Load student photo if available
                    if (student?.has_photo && student?.photo_path) {
                        try {
                            const photoUrl = await cardAPI.getStudentPhoto(student._id);
                            setStudentPhoto(photoUrl);
                        } catch (photoError) {
                            console.log('📸 No student photo available for preview');
                        }
                    }
                    
                    setLoading(false);
                } else {
                    setError('No template found');
                    setLoading(false);
                }
            } catch (err) {
                console.error('❌ Error loading template preview:', err);
                setError('Failed to load template preview');
                setLoading(false);
            }
        };

        if (template) {
            loadPreview();
        } else {
            setLoading(false);
            setError('No template selected');
        }
    }, [template, student]);

    // ... loading and error states remain the same ...

    return (
        <div className="relative w-full h-full">
            <img
                src={frontPreview}
                alt="Template Preview"
                className="w-full h-full object-contain rounded-xl"
                onError={(e) => {
                    console.error('❌ Image failed to load');
                    setError('Image failed to load');
                }}
            />

            {/* Coordinate-based overlay */}
            <div className="absolute inset-0">
                {/* Photo placeholder - NOW SHOWS ACTUAL PHOTO */}
                {coordinates.photo && (
                    <div
                        className="absolute rounded-lg flex items-center justify-center border-2 border-white overflow-hidden"
                        style={{
                            left: `${coordinates.photo.x}px`,
                            top: `${coordinates.photo.y}px`,
                            width: `${coordinates.photo.width}px`,
                            height: `${coordinates.photo.height}px`,
                            backgroundColor: studentPhoto ? 'transparent' : 'rgba(16, 185, 129, 0.5)'
                        }}
                    >
                        {studentPhoto ? (
                            <img 
                                src={studentPhoto} 
                                alt="Student" 
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <i className="pi pi-user text-white text-sm"></i>
                        )}
                    </div>
                )}

                {/* Rest of your text overlays remain the same */}
                {coordinates.name && (
                    <div
                        className="absolute text-white font-bold bg-black bg-opacity-60 px-2 py-1 rounded text-xs whitespace-nowrap"
                        style={{
                            left: `${coordinates.name.x}px`,
                            top: `${coordinates.name.y}px`,
                            maxWidth: `${coordinates.name.maxWidth}px`
                        }}
                    >
                        {student?.name || 'Student Name'}
                    </div>
                )}
                {/* ... other text fields ... */}
            </div>
        </div>
    );
};
}

export default ENZO