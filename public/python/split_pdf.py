from pyPdf import PdfFileWriter, PdfFileReader
import sys

def main():
	try:
		url = sys.argv[1]
	except IndexError:
		sys.exit("No input file specified.")
		
	try:
		output_format = sys.argv[2]
	except IndexError:
		sys.exit("No output format specified.")
	

	try:
		inputpdf = PdfFileReader(open(url, "rb"))
	except IOError:
		sys.exit("Input file '{}' not found.".format(url))

	for i in xrange(inputpdf.numPages):
		output = PdfFileWriter()
		output.addPage(inputpdf.getPage(i))
		
		with open(output_format.format(i+1), "wb") as outputStream: #i+1 because 0 is the index for the whole presentation
			output.write(outputStream)
			
	print(inputpdf.numPages)
			
if __name__ == "__main__":
	main()