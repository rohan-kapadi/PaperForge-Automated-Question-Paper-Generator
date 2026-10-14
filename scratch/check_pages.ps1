$word = New-Object -ComObject Word.Application
$word.Visible = $false
$doc = $word.Documents.Open('c:\Rohan\Projects\Mini Project\apps\parser-service\test_output.docx')
$pages = $doc.ComputeStatistics(2)
Write-Host "DOCX PAGE COUNT: $pages"
$pdfPath = 'c:\Rohan\Projects\Mini Project\scratch\test_output.pdf'
$doc.SaveAs([ref]$pdfPath, [ref]17)
$doc.Close([ref]$false)
$word.Quit()
Write-Host "Exported PDF to $pdfPath"
