import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiSave, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';

const FormOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const FormContainer = styled.div`
  background: var(--white);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
`;

const FormHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
`;

const FormTitle = styled.h2`
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  padding: var(--spacing-xs);
  
  &:hover {
    color: var(--primary-color);
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
`;

const Label = styled.label`
  font-weight: 500;
`;

const Input = styled.input`
  padding: var(--spacing-sm);
  border: 1px solid var(--mid-gray);
  border-radius: var(--radius-md);
  
  &:focus {
    border-color: var(--primary-color);
    outline: none;
  }
`;

const Select = styled.select`
  padding: var(--spacing-sm);
  border: 1px solid var(--mid-gray);
  border-radius: var(--radius-md);
  
  &:focus {
    border-color: var(--primary-color);
    outline: none;
  }
`;

const TextArea = styled.textarea`
  padding: var(--spacing-sm);
  border: 1px solid var(--mid-gray);
  border-radius: var(--radius-md);
  min-height: 100px;
  resize: vertical;
  
  &:focus {
    border-color: var(--primary-color);
    outline: none;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-lg);
`;

const DocumentEditForm = ({ document, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    display_name: '',
    document_type: '',
    description: '',
    department: '',
    issued_date: '',
    effective_date: '',
    expiry_date: '',
    reference_number: '',
    is_active: true
  });

  useEffect(() => {
    if (document) {
      setFormData({
        display_name: document.display_name || '',
        document_type: document.document_type || '',
        description: document.description || '',
        department: document.department || '',
        issued_date: document.issued_date ? new Date(document.issued_date).toISOString().split('T')[0] : '',
        effective_date: document.effective_date ? new Date(document.effective_date).toISOString().split('T')[0] : '',
        expiry_date: document.expiry_date ? new Date(document.expiry_date).toISOString().split('T')[0] : '',
        reference_number: document.reference_number || '',
        is_active: document.is_active
      });
    }
  }, [document]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onSave(formData);
      toast.success('Đã cập nhật tài liệu thành công');
      onClose();
    } catch (error) {
      toast.error('Không thể cập nhật tài liệu');
    }
  };

  return (
    <FormOverlay onClick={onClose}>
      <FormContainer onClick={e => e.stopPropagation()}>
        <FormHeader>
          <FormTitle>Chỉnh sửa tài liệu</FormTitle>
          <CloseButton onClick={onClose}>
            <FiX />
          </CloseButton>
        </FormHeader>

        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="display_name">Tên hiển thị</Label>
            <Input
              type="text"
              id="display_name"
              name="display_name"
              value={formData.display_name}
              onChange={handleChange}
              required
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="document_type">Loại tài liệu</Label>
            <Select
              id="document_type"
              name="document_type"
              value={formData.document_type}
              onChange={handleChange}
              required
            >
              <option value="">Chọn loại tài liệu</option>
              <option value="policy">Chính sách</option>
              <option value="regulation">Quy định</option>
              <option value="admission">Tuyển sinh</option>
              <option value="training">Đào tạo</option>
              <option value="student">Công tác sinh viên</option>
              <option value="financial">Tài chính</option>
              <option value="facility">Cơ sở vật chất</option>
              <option value="other">Khác</option>
            </Select>
          </FormGroup>

          <FormGroup>
            <Label htmlFor="description">Mô tả</Label>
            <TextArea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="department">Khoa/Phòng ban</Label>
            <Input
              type="text"
              id="department"
              name="department"
              value={formData.department}
              onChange={handleChange}
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="reference_number">Số hiệu văn bản</Label>
            <Input
              type="text"
              id="reference_number"
              name="reference_number"
              value={formData.reference_number}
              onChange={handleChange}
            />
          </FormGroup>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--spacing-md)' }}>
            <FormGroup>
              <Label htmlFor="issued_date">Ngày ban hành</Label>
              <Input
                type="date"
                id="issued_date"
                name="issued_date"
                value={formData.issued_date}
                onChange={handleChange}
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="effective_date">Ngày có hiệu lực</Label>
              <Input
                type="date"
                id="effective_date"
                name="effective_date"
                value={formData.effective_date}
                onChange={handleChange}
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="expiry_date">Ngày hết hiệu lực</Label>
              <Input
                type="date"
                id="expiry_date"
                name="expiry_date"
                value={formData.expiry_date}
                onChange={handleChange}
              />
            </FormGroup>
          </div>

          <FormGroup>
            <Label>
              <Input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
              />
              Còn hiệu lực
            </Label>
          </FormGroup>

          <ButtonGroup>
            <button type="button" className="button-secondary" onClick={onClose}>
              Hủy
            </button>
            <button type="submit">
              <FiSave /> Lưu thay đổi
            </button>
          </ButtonGroup>
        </Form>
      </FormContainer>
    </FormOverlay>
  );
};

export default DocumentEditForm; 