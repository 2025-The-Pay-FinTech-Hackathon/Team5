import React from 'react';
import { Button, Menu, MenuItem } from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const LedgerExport = ({ data }) => {
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const exportToCSV = () => {
    const headers = ['날짜', '항목', '금액', '분류', '메모'];
    const csvContent = [
      headers.join(','),
      ...data.map(item => [
        item.date,
        item.title,
        item.amount,
        item.category,
        item.memo
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `가계부_${new Date().toLocaleDateString()}.csv`;
    link.click();
    handleClose();
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    doc.text('가계부 내역', 14, 15);
    
    doc.autoTable({
      head: [['날짜', '항목', '금액', '분류', '메모']],
      body: data.map(item => [
        item.date,
        item.title,
        item.amount,
        item.category,
        item.memo
      ]),
      startY: 25,
    });

    doc.save(`가계부_${new Date().toLocaleDateString()}.pdf`);
    handleClose();
  };

  return (
    <>
      <Button
        variant="contained"
        startIcon={<FileDownloadIcon />}
        onClick={handleClick}
      >
        내보내기
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        <MenuItem onClick={exportToCSV}>CSV로 내보내기</MenuItem>
        <MenuItem onClick={exportToPDF}>PDF로 내보내기</MenuItem>
      </Menu>
    </>
  );
};

export default LedgerExport; 