import React, { useState, useRef, useEffect } from 'react';
import { cardAPI, templateAPI } from '../../services/api';

const CardGeneration = () => {
    const [activeStep, setActiveStep] = useState('upload');
    const [generationMode, setGenerationMode] = useState('batch');
    const [generationStatus, setGenerationStatus] = useState('idle');
    const [progress, setProgress] = useState(0);
    const [batchInfo, setBatchInfo] = useState(null);
    const [students, setStudents] = useState([]);
    const [showPhotoModal, setShowPhotoModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [uploadedPhoto, setUploadedPhoto] = useState(null);
    const [templates, setTemplates] = useState([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [photoUploadStatus, setPhotoUploadStatus] = useState('idle');
    //Coordinates
    const [coordinates, setCoordinates] = useState({
        photo: { x: 34, y: 250, width: 260, height: 250 },     // Adjusted for 1080x607
        name: { x: 570, y: 240, maxWidth: 500 },
        class: { x: 530, y: 300, maxWidth: 500 },
        level: { x: 530, y: 320, maxWidth: 500 },
        gender: { x: 530, y: 300, maxWidth: 550 },
        residence: { x: 570, y: 380, maxWidth: 500 },
        academic_year: { x: 610, y: 425, maxWidth: 550 }
    });
    const [templateDimensions, setTemplateDimensions] = useState({
        width: 1080,
        height: 607
    });

    // Refs
    const csvFileRef = useRef(null);
    const photoZipRef = useRef(null);
    const templateRef = useRef(null);

    // UseEffect for Automatic Load Data
    useEffect(() => {
        loadTemplates();
        loadTemplateDimensions();

        if (generationMode === 'single') {
            loadStudents();
        }
    }, [generationMode, selectedTemplateId]);

    //Load Students
    const loadStudents = async () => {
        try {
            const response = await cardAPI.getStudents();
            if (response.success) {
                setStudents(response.students);
            }
        } catch (error) {
            console.error('Failed to load students:', error);
        }
    };

    //Load templates
    const loadTemplates = async () => {
        try {
            const response = await templateAPI.getTemplates();
            if (response.success) {
                setTemplates(response.templates);
                // Auto-select default template
                const defaultTemplate = response.templates.find(t => t.isDefault);
                if (defaultTemplate) {
                    setSelectedTemplateId(defaultTemplate._id);
                    // Load template preview images
                    loadTemplatePreviews(defaultTemplate);
                }
            }
        } catch (error) {
            console.error('Failed to load templates:', error);
        }
    };

    // Load template preview URLs
    const loadTemplatePreviews = async (template) => {
        try {
            if (template.frontSide?.filename) {
                const frontUrl = await templateAPI.previewTemplate(template.frontSide.filename);
                console.log('🖼️ Front preview URL:', frontUrl);
                // You can store these URLs in state if needed for preview
            }
            if (template.backSide?.filename) {
                const backUrl = await templateAPI.previewTemplate(template.backSide.filename);
                console.log('🖼️ Back preview URL:', backUrl);
            }
        } catch (error) {
            console.error('Error loading template previews:', error);
        }
    };

    //Load template Dimensions
    const loadTemplateDimensions = async () => {
        if (selectedTemplateId) {
            try {
                console.log('📏 Loading template dimensions for:', selectedTemplateId);
                const response = await cardAPI.getTemplateDimensions(selectedTemplateId);
                if (response.success) {
                    setTemplateDimensions(response.dimensions);
                    console.log('✅ Template dimensions loaded:', response.dimensions);
                }
            } catch (error) {
                console.error('❌ Failed to load template dimensions:', error);
                // Keep default dimensions
            }
        }
    };

    // Handle modal cancel with reset
    const handleModalCancel = () => {
        setShowPhotoModal(false);
        setUploadedPhoto(null);
        setPhotoUploadStatus('idle');
    };


    // ✅ FIXED: Single student selection with proper photo validation
    const handleSingleStudentSelect = (studentId) => {
        const student = students.find(s => s._id === studentId);
        if (!student) return;

        setSelectedStudent(student);

        // Check if template is selected
        if (!selectedTemplateId) {
            alert('Please select a template first');
            setActiveStep('template');
            return;
        }

        console.log('📸 Student photo status:', {
            name: student.name,
            has_photo: student.has_photo,
            photo_path: student.class
        });
        console.log(JSON.stringify(student, null, 2));

        // ✅ FIXED: Check if student has photo in database
        if (!student.has_photo) {
            console.log('📸 Student needs photo - showing modal');
            setShowPhotoModal(true);
        } else {
            // Student has photo and template is ready, proceed to process
            console.log('✅ Student has photo - proceeding to generation');
            setActiveStep('process');
        }
    };

    // ✅ FIXED: Single-click CSV processing with template check
    const handleCSVProcessing = async (e) => {
        e.preventDefault();

        // Validate template
        if (!selectedTemplateId) {
            alert('Please select a template first');
            setActiveStep('template');
            return;
        }

        // Validate CSV
        if (!csvFileRef.current?.files[0]) {
            alert('Please select a CSV file');
            return;
        }

        setGenerationStatus('processing');
        setProgress(0);

        const formData = new FormData();

        // Add files
        formData.append('csv', csvFileRef.current.files[0]);
        formData.append('templateId', selectedTemplateId);

        if (photoZipRef.current?.files[0]) {
            formData.append('photoZip', photoZipRef.current.files[0]);
        }

        // Add coordinates
        formData.append('coordinates', JSON.stringify(coordinates));

        try {
            // Simulate progress
            const progressInterval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 90;
                    }
                    return prev + 10;
                });
            }, 500);

            // ✅ FIXED: Call API and handle blob response
            const zipBlob = await cardAPI.processCSVAndGenerate(formData);

            clearInterval(progressInterval);
            setProgress(100);
            setGenerationStatus('completed');

            // ✅ FIXED: Create download from blob
            const url = window.URL.createObjectURL(zipBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `batch-id-cards-${Date.now()}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            // ✅ Update batch info for UI
            setBatchInfo({
                totalCards: 1, // You might want to get actual count from somewhere
                processed: 1,
                failed: 0
            });

        } catch (error) {
            setGenerationStatus('error');
            console.error('❌ Batch processing error:', error);

            // Handle JSON errors
            if (error.message && error.message.includes('Unexpected token')) {
                try {
                    const errorText = await error.response.text();
                    const errorData = JSON.parse(errorText);
                    alert(`Processing failed: ${errorData.error}`);
                } catch {
                    alert('Processing failed: Unknown error');
                }
            } else {
                alert(`Processing failed: ${error.message}`);
            }
        }
    };

    // ✅ FIXED: Single student generation with template
    const generateSingleStudentCard = async (student, photoFile) => {
        // Validate template
        if (!selectedTemplateId) {
            alert('Please select a template first');
            setActiveStep('template');
            return;
        }

        setGenerationStatus('processing');
        setProgress(0);

        try {
            const progressInterval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 90;
                    }
                    return prev + 20;
                });
            }, 300);

            // ✅ FIXED: Create FormData
            const formData = new FormData();
            formData.append('studentId', student._id);
            formData.append('templateId', selectedTemplateId);
            formData.append('coordinates', JSON.stringify(coordinates));

            // ✅ Append photo file if provided
            if (photoFile) {
                formData.append('photo', photoFile);
            }

            console.log('📤 Generating single card...');

            // ✅ FIXED: Call API and handle blob response
            const zipBlob = await cardAPI.generateSingleCardWithTemplate(formData);

            clearInterval(progressInterval);
            setProgress(100);
            setGenerationStatus('completed');

            // ✅ FIXED: Create download from blob
            const url = window.URL.createObjectURL(zipBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `id-card-${student.student_id}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            // ✅ Update batch info for UI
            setBatchInfo({
                totalCards: 1,
                processed: 1,
                failed: 0,
                studentName: student.name
            });

        } catch (error) {
            setGenerationStatus('error');
            console.error('❌ Card generation error:', error);

            // Check if it's a JSON error (backend sent error instead of blob)
            if (error.message && error.message.includes('Unexpected token')) {
                // Try to parse as JSON error
                try {
                    const errorText = await error.response.text();
                    const errorData = JSON.parse(errorText);
                    alert(`Card generation failed: ${errorData.error}`);
                } catch {
                    alert('Card generation failed: Unknown error');
                }
            } else if (error.error === 'PHOTO_REQUIRED') {
                setShowPhotoModal(true);
            } else {
                alert(`Card generation failed: ${error.message}`);
            }
        }
    };

    // ✅ NEW: Handle photo upload only (save to student profile)
    const handlePhotoUploadOnly = async () => {
        if (!uploadedPhoto || !selectedStudent) return;

        try {
            setGenerationStatus('processing');

            const formData = new FormData();
            formData.append('studentId', selectedStudent._id);
            formData.append('photo', uploadedPhoto);

            // Call API to save photo only
            const response = await cardAPI.uploadStudentPhoto(formData);

            if (response.success) {
                // ✅ Update local student data
                const updatedStudents = students.map(student =>
                    student._id === selectedStudent._id
                        ? {
                            ...student,
                            has_photo: true,
                            photo_path: response.photo_path
                        }
                        : student
                );

                setStudents(updatedStudents);

                // ✅ Update selected student
                setSelectedStudent(prev => ({
                    ...prev,
                    has_photo: true,
                    photo_path: response.photo_path
                }));

                // ✅ Close modal and show success
                setShowPhotoModal(false);
                setUploadedPhoto(null);

                // ✅ Move to process step automatically
                setActiveStep('process');

                alert('Photo uploaded successfully! You can now generate the card.');
            }
        } catch (error) {
            console.error('❌ Photo upload error:', error);
            alert('Photo upload failed. Please try again.');
        } finally {
            setGenerationStatus('idle');
        }
    };

    const handleCoordinateChange = (field, axis, value) => {
        setCoordinates(prev => ({
            ...prev,
            [field]: {
                ...prev[field],
                [axis]: parseInt(value) || 0
            }
        }));
    };

    // Status helpers
    const getStatusColor = (status) => {
        const colors = {
            idle: 'text-gray-500',
            processing: 'text-blue-600',
            validating: 'text-amber-600',
            generating: 'text-purple-600',
            finalizing: 'text-emerald-600',
            downloading: 'text-blue-600',
            completed: 'text-green-600',
            error: 'text-red-600'
        };
        return colors[status] || 'text-gray-500';
    };

    const getStatusIcon = (status) => {
        const icons = {
            idle: 'pi-clock',
            processing: 'pi-spinner pi-spin',
            validating: 'pi-check-circle',
            generating: 'pi-qrcode',
            finalizing: 'pi-cog',
            downloading: 'pi-download',
            completed: 'pi-check-circle',
            error: 'pi-times-circle'
        };
        return icons[status] || 'pi-clock';
    };

    // Get the selected template
    const selectedTemplate = templates.find(t => t._id === selectedTemplateId);

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Card Generation Studio</h1>
                    <p className="text-gray-600 mt-2">Generate ID cards for single students or batch process</p>
                </div>

                {/* Generation Mode Selector */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold text-gray-900">Generation Mode</h2>
                        <i className="pi pi-sitemap text-emerald-600 text-xl"></i>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                            onClick={() => setGenerationMode('batch')}
                            className={`p-6 rounded-2xl border-2 text-left transition-all duration-300 ${generationMode === 'batch'
                                ? 'border-emerald-500 bg-emerald-50 shadow-lg'
                                : 'border-gray-200 bg-white hover:border-emerald-300'
                                }`}
                        >
                            <div className="flex items-center space-x-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${generationMode === 'batch' ? 'bg-emerald-500' : 'bg-gray-100'
                                    }`}>
                                    <i className={`pi pi-users text-lg ${generationMode === 'batch' ? 'text-white' : 'text-gray-600'
                                        }`}></i>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">Batch Processing</h3>
                                    <p className="text-sm text-gray-600 mt-1">Upload CSV + photos to generate multiple cards</p>
                                </div>
                            </div>
                        </button>

                        <button
                            onClick={() => setGenerationMode('single')}
                            className={`p-6 rounded-2xl border-2 text-left transition-all duration-300 ${generationMode === 'single'
                                ? 'border-emerald-500 bg-emerald-50 shadow-lg'
                                : 'border-gray-200 bg-white hover:border-emerald-300'
                                }`}
                        >
                            <div className="flex items-center space-x-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${generationMode === 'single' ? 'bg-emerald-500' : 'bg-gray-100'
                                    }`}>
                                    <i className={`pi pi-user text-lg ${generationMode === 'single' ? 'text-white' : 'text-gray-600'
                                        }`}></i>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">Single Student</h3>
                                    <p className="text-sm text-gray-600 mt-1">Generate card for individual student</p>
                                </div>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-1 gap-6">
                    {/* Left Column - Controls */}
                    <div className="xl:col-span-2 space-y-6">
                        {/* Step Navigation */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-semibold text-gray-900">Generation Workflow</h2>
                                <i className="pi pi-sitemap text-emerald-600 text-xl"></i>
                            </div>

                            <div className="grid grid-cols-4 gap-4">
                                <WorkflowStep
                                    step="1"
                                    title={generationMode === 'batch' ? "Upload" : "Select"}
                                    description={generationMode === 'batch' ? "Data & Assets" : "Student"}
                                    active={activeStep === 'upload'}
                                    completed={['template', 'coordinates', 'process'].includes(activeStep)}
                                    icon={generationMode === 'batch' ? 'pi-cloud-upload' : 'pi-user'}
                                    onClick={() => setActiveStep('upload')}
                                />
                                <WorkflowStep
                                    step="2"
                                    title="Template"
                                    description="Design & Layout"
                                    active={activeStep === 'template'}
                                    completed={['coordinates', 'process'].includes(activeStep)}
                                    icon="pi-image"
                                    onClick={() => setActiveStep('template')}
                                />
                                <WorkflowStep
                                    step="3"
                                    title="Coordinates"
                                    description="Field Positioning"
                                    active={activeStep === 'coordinates'}
                                    completed={['process'].includes(activeStep)}
                                    icon="pi-arrows-alt"
                                    onClick={() => setActiveStep('coordinates')}
                                />
                                <WorkflowStep
                                    step="4"
                                    title="Process"
                                    description="Generate & Download"
                                    active={activeStep === 'process'}
                                    completed={false}
                                    icon="pi-cog"
                                    onClick={() => setActiveStep('process')}
                                />
                            </div>
                        </div>

                        {/* Dynamic Content */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                            {/* BATCH UPLOAD STEP */}
                            {activeStep === 'upload' && generationMode === 'batch' && (
                                <div className="space-y-6">
                                    <h3 className="text-lg font-semibold text-gray-900">Upload Student Data</h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FileUploadCard
                                            title="Student Data (CSV)"
                                            description="Upload CSV file with student information"
                                            accept=".csv"
                                            ref={csvFileRef}
                                            icon="pi-file-excel"
                                            color="emerald"
                                        />
                                        <FileUploadCard
                                            title="Student Photos (ZIP)"
                                            description="ZIP folder containing student photos"
                                            accept=".zip"
                                            ref={photoZipRef}
                                            icon="pi-images"
                                            color="blue"
                                            note="Supports JPG, JPEG, PNG - Optional"
                                        />
                                    </div>

                                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                        <div className="flex items-start space-x-3">
                                            <i className="pi pi-info-circle text-amber-600 text-lg mt-0.5"></i>
                                            <div>
                                                <p className="text-sm font-medium text-amber-800">Upload Requirements</p>
                                                <p className="text-xs text-amber-700 mt-1">
                                                    CSV must include: student_id, name, class, level, residence, gender, academic_year
                                                </p>
                                                <p className="text-xs text-amber-700">
                                                    Photos should be named matching student_id (e.g., STU001.jpg)
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* SINGLE STUDENT SELECTION STEP */}
                            {activeStep === 'upload' && generationMode === 'single' && (
                                <div className="space-y-6">
                                    <h3 className="text-lg font-semibold text-gray-900">Select Student</h3>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Choose Student
                                        </label>
                                        <select
                                            onChange={(e) => handleSingleStudentSelect(e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                        >
                                            <option value="">Select a student...</option>
                                            {students.map(student => (
                                                <option key={student._id} value={student._id}>
                                                    {student.name} - {student.student_id}
                                                    {!student.has_photo && ' 📸(Needs Photo)'}
                                                    {student.card_generated && ` ✅(${student.card_generation_count} cards)`}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {selectedStudent && (
                                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                                            <div className="flex items-center space-x-3">
                                                <i className="pi pi-check-circle text-emerald-600 text-lg"></i>
                                                <div>
                                                    <p className="font-medium text-emerald-800">Student Selected</p>
                                                    <p className="text-sm text-emerald-700">
                                                        {selectedStudent.name} ({selectedStudent.student_id}) - {selectedStudent.class}
                                                    </p>
                                                    <p className="text-xs text-emerald-600 mt-1">
                                                        {selectedStudent.has_photo ? '✅ Photo available' : '📸 Photo required'}
                                                        {selectedStudent.card_generated && ` • ${selectedStudent.card_generation_count} cards generated`}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ✅ FIXED: TEMPLATE STEP - SHOW ONLY DEFAULT TEMPLATE */}
                            {activeStep === 'template' && (
                                <div className="space-y-6">
                                    <h3 className="text-lg font-semibold text-gray-900">Template Selection</h3>
                                    <p className="text-sm text-gray-600">Using default template for card generation</p>

                                    <div className="space-y-4">
                                        {templates.length === 0 ? (
                                            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-xl">
                                                <i className="pi pi-images text-gray-400 text-4xl mb-3"></i>
                                                <p className="text-gray-600">No templates available</p>
                                                <p className="text-sm text-gray-500 mt-1">Upload templates in Template Manager first</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {/* Show only default template */}
                                                {templates.filter(template => template.isDefault).map(template => (
                                                    <DefaultTemplateCard
                                                        key={template._id}
                                                        template={template}
                                                        selected={selectedTemplateId === template._id}
                                                        onSelect={() => setSelectedTemplateId(template._id)}
                                                    />
                                                ))}

                                                {/* Show message if no default template */}
                                                {templates.filter(template => template.isDefault).length === 0 && (
                                                    <div className="text-center py-8 border-2 border-dashed border-amber-300 rounded-xl bg-amber-50">
                                                        <i className="pi pi-exclamation-triangle text-amber-500 text-4xl mb-3"></i>
                                                        <p className="text-amber-800 font-medium">No Default Template Set</p>
                                                        <p className="text-sm text-amber-700 mt-1">
                                                            Please set a default template in Template Manager
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {selectedTemplateId && (
                                        <div className="flex justify-end">
                                            <button
                                                onClick={() => setActiveStep('coordinates')}
                                                className="bg-emerald-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-emerald-600 transition-colors"
                                            >
                                                Continue to Coordinates
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* COORDINATES STEP */}
                            {activeStep === 'coordinates' && (
                                <div className="space-y-6">
                                    <h3 className="text-lg font-semibold text-gray-900">Field Positioning</h3>
                                    <p className="text-sm text-gray-600">Adjust field positions on the card template</p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {Object.entries(coordinates).map(([field, coords]) => (
                                            <CoordinateControl
                                                key={field}
                                                field={field}
                                                coordinates={coords}
                                                onChange={handleCoordinateChange}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* PROCESS STEP */}
                            {activeStep === 'process' && generationMode === 'batch' && (
                                <ProcessStep
                                    onGenerate={handleCSVProcessing}
                                    generationStatus={generationStatus}
                                    progress={progress}
                                    batchInfo={batchInfo}
                                    mode="batch"
                                />
                            )}

                            {activeStep === 'process' && generationMode === 'single' && (
                                <ProcessStep
                                    onGenerate={() => selectedStudent && generateSingleStudentCard(selectedStudent, null)}
                                    generationStatus={generationStatus}
                                    progress={progress}
                                    batchInfo={batchInfo}
                                    mode="single"
                                    student={selectedStudent}
                                />
                            )}
                        </div>
                    </div>

                    {/* Right Column - Preview & Status */}
                    <div className="space-y-6">

                        {/* Live Preview */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold text-gray-900">Live Preview</h3>
                                <i className="pi pi-eye text-emerald-600 text-xl"></i>
                            </div>

                            <div className="bg-gray-900 rounded-2xl p-4 flex items-center justify-center border-2 border-emerald-200/30">
                                {selectedTemplate ? (
                                    <>
                                        {/* For Single Student Mode */}
                                        {generationMode === 'single' && (
                                            <TemplatePreview
                                                template={selectedTemplate}
                                                coordinates={coordinates}
                                                student={selectedStudent}
                                                templateDimensions={templateDimensions}
                                            />
                                        )}

                                        {/* For Batch Mode - Show first student from CSV as preview */}
                                        {generationMode === 'batch' && (
                                            <TemplatePreview
                                                template={selectedTemplate}
                                                coordinates={coordinates}
                                                students={students} // Pass the students array
                                                templateDimensions={templateDimensions}
                                            />
                                        )}
                                    </>
                                ) : (
                                    <div className="text-center text-white flex items-center justify-center">
                                        <div className="w-[400px] h-[300px] bg-gradient-to-br from-emerald-400 to-green-500 rounded-xl flex items-center justify-center">
                                            <div className="text-center">
                                                <i className="pi pi-image text-4xl mb-4 opacity-50"></i>
                                                <p>Select a template to preview</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 text-center">
                                <p className="text-sm text-gray-600">
                                    Template: {templateDimensions.width}x{templateDimensions.height}px
                                </p>
                                <p className="text-xs text-emerald-600 font-medium">
                                    ✅ Preview matches actual generation dimensions
                                </p>
                            </div>
                        </div>

                        {/* Generation Status */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {generationMode === 'batch' ? 'Batch Status' : 'Generation Status'}
                                </h3>
                                <i className={`pi ${getStatusIcon(generationStatus)} ${getStatusColor(generationStatus)} text-xl`}></i>
                            </div>

                            <div className="space-y-4">
                                <StatusItem
                                    label="Current Status"
                                    value={generationStatus}
                                    valueClass={getStatusColor(generationStatus)}
                                    icon={getStatusIcon(generationStatus)}
                                />

                                {generationStatus !== 'idle' && generationStatus !== 'error' && (
                                    <>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Processing Progress</span>
                                                <span className="font-medium text-emerald-600">{Math.round(progress)}%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-gradient-to-r from-emerald-500 to-green-600 h-2 rounded-full transition-all duration-500"
                                                    style={{ width: `${progress}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        {batchInfo && generationStatus === 'completed' && (
                                            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                                                <div className="text-center">
                                                    <div className="text-2xl font-bold text-emerald-600">{batchInfo.totalCards}</div>
                                                    <div className="text-xs text-gray-600">Total</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-2xl font-bold text-green-600">{batchInfo.processed}</div>
                                                    <div className="text-xs text-gray-600">Processed</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-2xl font-bold text-red-600">{batchInfo.failed}</div>
                                                    <div className="text-xs text-gray-600">Failed</div>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}

                                {generationStatus === 'completed' && batchInfo && (
                                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                                        <i className="pi pi-check-circle text-green-500 text-2xl mb-2"></i>
                                        <p className="text-green-800 font-medium">Download Complete!</p>
                                        <p className="text-green-600 text-sm">
                                            {batchInfo.studentName
                                                ? `Card for ${batchInfo.studentName} downloaded`
                                                : 'Batch cards downloaded to your computer'
                                            }
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Photo Upload Modal */}
            {showPhotoModal && selectedStudent && (
                <PhotoUploadModal
                    student={selectedStudent}
                    onPhotoSave={handlePhotoUploadOnly}
                    onCancel={handleModalCancel}
                    uploadedPhoto={uploadedPhoto}
                    setUploadedPhoto={setUploadedPhoto}
                    uploadStatus={photoUploadStatus}
                />
            )}
        </div>
    );
};

// ========== COMPONENTS ==========

// ✅ NEW: Default Template Card Component
const DefaultTemplateCard = ({ template, selected, onSelect }) => {
    const [frontPreview, setFrontPreview] = useState(null);
    const [backPreview, setBackPreview] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadPreviews = async () => {
            setLoading(true);
            try {
                if (template.frontSide?.filename) {
                    const frontUrl = await templateAPI.previewTemplate(template.frontSide.filename);
                    setFrontPreview(frontUrl);
                }
                if (template.backSide?.filename) {
                    const backUrl = await templateAPI.previewTemplate(template.backSide.filename);
                    setBackPreview(backUrl);
                }
            } catch (error) {
                console.error('Error loading template previews:', error);
            } finally {
                setLoading(false);
            }
        };

        loadPreviews();
    }, [template]);

    return (
        <div
            onClick={onSelect}
            className={`border-2 rounded-2xl p-6 cursor-pointer transition-all duration-300 ${selected
                ? 'border-emerald-500 bg-emerald-50 shadow-lg'
                : 'border-gray-200 hover:border-emerald-300'
                }`}
        >
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h4 className="text-lg font-bold text-gray-900">{template.name}</h4>
                    {template.description && (
                        <p className="text-sm text-gray-600">{template.description}</p>
                    )}
                </div>
                <span className="bg-emerald-100 text-emerald-800 text-sm px-3 py-1 rounded-full font-medium">
                    Default Template
                </span>
            </div>

            <div className="flex space-x-4">
                {/* Front Side */}
                <div className="flex-1">
                    <div className="text-sm font-medium text-gray-700 mb-2">Front Side</div>
                    <div className="aspect-[3/4] bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden border-2 border-gray-300">
                        {frontPreview ? (
                            <img
                                src={frontPreview}
                                alt={`${template.name} - Front`}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="text-center text-gray-400">
                                <i className="pi pi-image text-2xl mb-2"></i>
                                <p className="text-xs">Loading...</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Back Side */}
                <div className="flex-1">
                    <div className="text-sm font-medium text-gray-700 mb-2">Back Side</div>
                    <div className="aspect-[3/4] bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden border-2 border-gray-300">
                        {backPreview ? (
                            <img
                                src={backPreview}
                                alt={`${template.name} - Back`}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="text-center text-gray-400">
                                <i className="pi pi-image text-2xl mb-2"></i>
                                <p className="text-xs">Loading...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-4 text-center">
                <p className="text-sm text-emerald-600 font-medium">
                    {selected ? '✓ Selected for generation' : 'Click to select this template'}
                </p>
            </div>
        </div>
    );
};


// ✅ UPDATED: Template Preview Component with better error handling
const TemplatePreview = ({
    template,
    coordinates,
    student,
    templateDimensions = { width: 1080, height: 607 },
    students = [] // Add students array for batch mode
}) => {
    const [frontPreview, setFrontPreview] = useState(null);
    const [studentPhoto, setStudentPhoto] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Scale factor to fit template in container (700x500 max)
    const scale = Math.min(700 / templateDimensions.width, 500 / templateDimensions.height);
    const displayWidth = templateDimensions.width * scale;
    const displayHeight = templateDimensions.height * scale;

    // Get display student - for single mode use selected student, for batch mode use first student
    const displayStudent = student || (students.length > 0 ? students[0] : null);

    useEffect(() => {
        const loadPreview = async () => {
            setLoading(true);
            setError(null);
            setStudentPhoto(null); // Reset photo when student changes

            try {
                if (template?.frontSide?.filename) {
                    const frontUrl = await templateAPI.previewTemplate(template.frontSide.filename);
                    setFrontPreview(frontUrl);

                    // Load student photo if available
                    if (displayStudent?.has_photo && displayStudent?.photo_path) {
                        try {
                            console.log(displayStudent);
                            const photoUrl = await cardAPI.getStudentPhoto(displayStudent._id);
                            console.log(photoUrl);
                            setStudentPhoto(photoUrl);
                        } catch (photoError) {
                            console.log('📸 No student photo available for preview:', photoError.message);
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
    }, [template, displayStudent]); // Reload when template or student changes

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full text-white">
                <i className="pi pi-spinner pi-spin text-2xl mr-2"></i>
                <p>Loading template preview...</p>
            </div>
        );
    }

    if (error || !frontPreview) {
        return (
            <div className="text-center text-white flex flex-col items-center justify-center h-full">
                <i className="pi pi-exclamation-triangle text-2xl mb-2"></i>
                <p>Template preview not available</p>
                <p className="text-sm text-gray-300 mt-1">Using fallback design</p>
            </div>
        );
    }

    return (
        <div className="flex justify-center">
            <div
                className="relative"
                style={{
                    width: `${displayWidth}px`,
                    height: `${displayHeight}px`
                }}
            >
                <img
                    src={frontPreview}
                    alt="Template Preview"
                    className="w-full h-full object-contain rounded-xl"
                />

                {/* Coordinate-based overlay - ALL COORDINATES SCALED CONSISTENTLY */}
                <div className="absolute inset-0">
                    {/* Photo placeholder - SHOW ACTUAL STUDENT PHOTO */}
                    {coordinates.photo && (
                        <div
                            className="absolute rounded-lg flex items-center justify-center border-2 border-white overflow-hidden"
                            style={{
                                left: `${coordinates.photo.x * scale}px`,
                                top: `${coordinates.photo.y * scale}px`,
                                width: `${coordinates.photo.width * scale}px`,
                                height: `${coordinates.photo.height * scale}px`,
                                backgroundColor: studentPhoto ? 'transparent' : 'rgba(16, 185, 129, 0.5)'
                            }}
                        >
                            {studentPhoto ? (
                                <img
                                    src={studentPhoto}
                                    alt="Student"
                                    className="w-full h-full object-cover rounded-xxl"
                                    onError={(e) => {
                                        console.error('❌ Failed to load student photo');
                                        e.target.style.display = 'none';
                                    }}
                                />
                            ) : (
                                <i className="pi pi-user text-white text-sm"></i>
                            )}
                        </div>
                    )}

                    {/* Name */}
                    {coordinates.name && (
                        <div
                            className="absolute text-white font-bold bg-black bg-opacity-60 px-2 py-1 rounded text-xs whitespace-nowrap"
                            style={{
                                left: `${coordinates.name.x * scale}px`,
                                top: `${coordinates.name.y * scale}px`,
                                maxWidth: `${coordinates.name.maxWidth * scale}px`
                            }}
                        >
                            {displayStudent?.name || 'Student Name'}
                        </div>
                    )}

                    {/* Class */}
                    {coordinates.class && (
                        <div
                            className="absolute text-emerald-300 bg-black bg-opacity-60 px-2 py-1 rounded text-xs whitespace-nowrap"
                            style={{
                                left: `${coordinates.class.x * scale}px`,
                                top: `${coordinates.class.y * scale}px`,
                                maxWidth: `${coordinates.class.maxWidth * scale}px`
                            }}
                        >
                            {displayStudent?.class || 'Class'}
                        </div>
                    )}

                    {/* Level */}
                    {coordinates.level && (
                        <div
                            className="absolute text-emerald-300 bg-black bg-opacity-60 px-2 py-1 rounded text-xs whitespace-nowrap"
                            style={{
                                left: `${coordinates.level.x * scale}px`,
                                top: `${coordinates.level.y * scale}px`,
                                maxWidth: `${coordinates.level.maxWidth * scale}px`
                            }}
                        >
                            {displayStudent?.level || 'Level'}
                        </div>
                    )}


                    {/* Gender */}
                    {coordinates.gender && (
                        <div
                            className="absolute text-gray-300 bg-black bg-opacity-60 px-2 py-1 rounded text-xs whitespace-nowrap"
                            style={{
                                left: `${coordinates.gender.x * scale}px`,
                                top: `${coordinates.gender.y * scale}px`,
                                maxWidth: `${coordinates.gender.maxWidth * scale}px`
                            }}
                        >
                            {displayStudent?.gender || 'Gender'}
                        </div>
                    )}
                    {/* Residence */}
                    {coordinates.residence && (
                        <div
                            className="absolute text-gray-300 bg-black bg-opacity-60 px-2 py-1 rounded text-xs whitespace-nowrap"
                            style={{
                                left: `${coordinates.residence.x * scale}px`,
                                top: `${coordinates.residence.y * scale}px`,
                                maxWidth: `${coordinates.residence.maxWidth * scale}px`
                            }}
                        >
                            {displayStudent?.residence || 'Residence'}
                        </div>
                    )}

                    {/* Academic Year */}
                    {coordinates.academic_year && (
                        <div
                            className="absolute text-gray-300 bg-black bg-opacity-60 px-2 py-1 rounded text-xs whitespace-nowrap"
                            style={{
                                left: `${coordinates.academic_year.x * scale}px`,
                                top: `${coordinates.academic_year.y * scale}px`,
                                maxWidth: `${coordinates.academic_year.maxWidth * scale}px`
                            }}
                        >
                            {displayStudent?.academic_year || '2024'}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


// ✅ FIXED: WorkflowStep with disabled state
const WorkflowStep = ({ step, title, description, active, completed, icon, onClick, disabled = false }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`text-left p-4 rounded-2xl border-2 transition-all duration-300 ${active
            ? 'border-emerald-500 bg-emerald-50 shadow-lg'
            : completed
                ? 'border-green-400 bg-green-50'
                : disabled
                    ? 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-50'
                    : 'border-gray-200 bg-white hover:border-emerald-300'
            }`}
    >
        <div className="flex items-center space-x-3 mb-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${active
                ? 'bg-emerald-500 text-white'
                : completed
                    ? 'bg-green-500 text-white'
                    : disabled
                        ? 'bg-gray-300 text-gray-600'
                        : 'bg-gray-200 text-gray-600'
                }`}>
                {completed ? <i className="pi pi-check text-xs"></i> : step}
            </div>
            <i className={`pi ${icon} ${active ? 'text-emerald-600' :
                completed ? 'text-green-600' :
                    disabled ? 'text-gray-400' : 'text-gray-400'
                }`}></i>
        </div>
        <div className="text-sm font-semibold text-gray-900">{title}</div>
        <div className={`text-xs ${active ? 'text-emerald-600' :
            completed ? 'text-green-600' :
                disabled ? 'text-gray-400' : 'text-gray-500'
            }`}>
            {description}
        </div>
    </button>
);



//File Upload
const FileUploadCard = React.forwardRef(({ title, description, accept, icon, color, note }, ref) => {
    const colorClasses = {
        emerald: 'bg-emerald-500',
        blue: 'bg-blue-500',
        purple: 'bg-purple-500'
    };

    return (
        <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 hover:border-emerald-400 transition-all duration-300">
            <div className="text-center space-y-3">
                <div className={`w-16 h-16 ${colorClasses[color]} rounded-2xl flex items-center justify-center mx-auto`}>
                    <i className={`pi ${icon} text-white text-2xl`}></i>
                </div>
                <div>
                    <p className="font-semibold text-gray-900">{title}</p>
                    <p className="text-sm text-gray-600 mt-1">{description}</p>
                    {note && <p className="text-xs text-emerald-600 mt-1">{note}</p>}
                </div>
                <input
                    type="file"
                    ref={ref}
                    accept={accept}
                    className="hidden"
                    id={`file-${title}`}
                />
                <label
                    htmlFor={`file-${title}`}
                    className="inline-block bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition-colors duration-200"
                >
                    Choose File
                </label>
            </div>
        </div>
    );
});

const CoordinateControl = ({ field, coordinates, onChange }) => (
    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
        <p className="font-medium text-gray-900 capitalize mb-3">{field.replace('_', ' ')}</p>
        <div className="grid grid-cols-2 gap-3">
            <div>
                <label className="text-xs text-gray-600 mb-1 block">X Position</label>
                <input
                    type="number"
                    value={coordinates.x}
                    onChange={(e) => onChange(field, 'x', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
            </div>
            <div>
                <label className="text-xs text-gray-600 mb-1 block">Y Position</label>
                <input
                    type="number"
                    value={coordinates.y}
                    onChange={(e) => onChange(field, 'y', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
            </div>
        </div>
    </div>
);

//Process Step
const ProcessStep = ({ onGenerate, generationStatus, progress, batchInfo, mode, student }) => (
    <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">
            {mode === 'batch' ? 'Generate ID Cards' : 'Generate Single Card'}
        </h3>

        {mode === 'single' && student && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center space-x-3">
                    <i className="pi pi-info-circle text-blue-600 text-lg"></i>
                    <div>
                        <p className="font-medium text-blue-800">Ready to Generate</p>
                        <p className="text-sm text-blue-700">
                            {student.name} ({student.student_id})
                        </p>
                        {student.card_generated && (
                            <p className="text-xs text-blue-600 mt-1">
                                ⚠️ This student already has {student.card_generation_count} card(s)
                            </p>
                        )}
                    </div>
                </div>
            </div>
        )}

        <div className="text-center space-y-4">
            <button
                onClick={onGenerate}
                disabled={generationStatus === 'processing' || (mode === 'single' && !student)}
                className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-8 py-4 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {generationStatus === 'processing' ? (
                    <span className="flex items-center justify-center">
                        <i className="pi pi-spinner pi-spin mr-3"></i>
                        Processing...
                    </span>
                ) : (
                    <span className="flex items-center justify-center">
                        <i className="pi pi-play mr-3"></i>
                        {mode === 'batch' ? 'Start Batch Generation' : 'Generate Card'}
                    </span>
                )}
            </button>
        </div>
    </div>
);

//Status Item
const StatusItem = ({ label, value, valueClass, icon }) => (
    <div className="flex items-center justify-between py-2">
        <span className="text-sm text-gray-600">{label}</span>
        <span className="flex items-center space-x-2">
            <span className={`text-sm font-medium capitalize ${valueClass}`}>{value}</span>
            <i className={`pi ${icon} ${valueClass}`}></i>
        </span>
    </div>
);

//Photo Modal
const PhotoUploadModal = ({ student, onPhotoSave, onCancel, uploadedPhoto, setUploadedPhoto, uploadStatus }) => {
    const [photoPreview, setPhotoPreview] = useState(null);

    // Handle photo selection with preview
    const handlePhotoSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setUploadedPhoto(file);
            // Create preview URL
            const previewUrl = URL.createObjectURL(file);
            setPhotoPreview(previewUrl);
        }
    };

    // Clean up preview URL when component unmounts
    useEffect(() => {
        return () => {
            if (photoPreview) {
                URL.revokeObjectURL(photoPreview);
            }
        };
    }, [photoPreview]);

    const getUploadButtonText = () => {
        switch (uploadStatus) {
            case 'uploading':
                return (
                    <>
                        <i className="pi pi-spinner pi-spin mr-2"></i>
                        Uploading...
                    </>
                );
            case 'error':
                return (
                    <>
                        <i className="pi pi-exclamation-triangle mr-2"></i>
                        Try Again
                    </>
                );
            default:
                return (
                    <>
                        <i className="pi pi-save mr-2"></i>
                        Save Photo
                    </>
                );
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full">
                <div className="text-center mb-6">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${uploadStatus === 'error' ? 'bg-red-500' : 'bg-amber-500'
                        }`}>
                        <i className={`pi pi-camera text-white text-2xl ${uploadStatus === 'uploading' ? 'pi-spin' : ''
                            }`}></i>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">
                        {uploadStatus === 'uploading' ? 'Uploading Photo...' : 'Photo Required'}
                    </h3>
                    <p className="text-gray-600 mt-2">
                        {student.name} ({student.student_id}) needs a photo for ID card
                    </p>
                </div>

                {/* Photo Preview Section */}
                {uploadedPhoto && photoPreview && (
                    <div className="mb-4 text-center">
                        <p className="text-sm font-medium text-gray-700 mb-2">Photo Preview:</p>
                        <div className="w-32 h-32 mx-auto border-2 border-emerald-200 rounded-xl overflow-hidden bg-gray-100">
                            <img
                                src={photoPreview}
                                alt="Preview"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <p className="text-xs text-emerald-600 mt-1 truncate">
                            {uploadedPhoto.name}
                        </p>
                    </div>
                )}

                {/* Upload Area */}
                <div className={`border-2 border-dashed rounded-2xl p-6 text-center mb-6 transition-colors ${uploadedPhoto ? 'border-emerald-300 bg-emerald-50' : 'border-gray-300 bg-gray-50'
                    }`}>
                    <input
                        type="file"
                        accept=".jpg,.jpeg,.png"
                        onChange={handlePhotoSelect}
                        className="hidden"
                        id="student-photo-upload"
                        disabled={uploadStatus === 'uploading'}
                    />
                    <label
                        htmlFor="student-photo-upload"
                        className={`inline-flex items-center px-6 py-3 rounded-xl font-medium cursor-pointer transition-colors ${uploadStatus === 'uploading'
                            ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                            : 'bg-emerald-500 text-white hover:bg-emerald-600'
                            }`}
                    >
                        <i className="pi pi-cloud-upload mr-2"></i>
                        {uploadedPhoto ? 'Change Photo' : 'Choose Photo'}
                    </label>
                    <p className="text-xs text-gray-500 mt-2">
                        Supports JPG, JPEG, PNG • Max 5MB
                    </p>
                </div>

                {/* Error Message */}
                {uploadStatus === 'error' && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                        <div className="flex items-center space-x-2">
                            <i className="pi pi-exclamation-circle text-red-500"></i>
                            <p className="text-sm text-red-700">Upload failed. Please try again.</p>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-3">
                    <button
                        onClick={onCancel}
                        disabled={uploadStatus === 'uploading'}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center disabled:opacity-50"
                    >
                        <i className="pi pi-times mr-2"></i>
                        Cancel
                    </button>
                    <button
                        onClick={onPhotoSave}
                        disabled={!uploadedPhoto || uploadStatus === 'uploading'}
                        className={`flex-1 px-4 py-3 rounded-xl font-medium transition-colors flex items-center justify-center ${!uploadedPhoto || uploadStatus === 'uploading'
                            ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                            : uploadStatus === 'error'
                                ? 'bg-red-500 text-white hover:bg-red-600'
                                : 'bg-emerald-500 text-white hover:bg-emerald-600'
                            }`}
                    >
                        {getUploadButtonText()}
                    </button>
                </div>
            </div>
        </div>
    );
};



export default CardGeneration;