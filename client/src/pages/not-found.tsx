import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home, ArrowLeft, Search } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-md mx-4 border-primary/10 shadow-lg overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary/50"></div>
          
          <div className="absolute top-0 right-0 w-32 h-32">
            <div className="w-full h-full bg-primary/5 rounded-bl-full transform -translate-y-16 translate-x-16"></div>
          </div>
          
          <CardContent className="pt-8 relative z-10">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="mb-6 flex justify-center"
            >
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                  <AlertCircle className="h-12 w-12 text-primary" />
                </div>
                <div className="absolute top-0 right-0 w-8 h-8 bg-white rounded-full border-4 border-primary flex items-center justify-center text-xl font-bold text-primary">
                  !
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <h1 className="text-2xl md:text-3xl font-bold gradient-heading text-center mb-2">
                404 - Page Not Found
              </h1>
              
              <p className="mt-4 text-center text-muted-foreground">
                The page you're looking for doesn't exist or has been moved.
              </p>
              
              <div className="mt-6 bg-primary/5 p-4 rounded-md border border-primary/10">
                <p className="text-sm text-muted-foreground">
                  You might have followed a broken link or entered an address that doesn't exist on our site.
                </p>
              </div>
            </motion.div>
          </CardContent>
          
          <CardFooter className="flex flex-col sm:flex-row gap-3 pb-8">
            <motion.div 
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="w-full sm:w-auto"
            >
              <Button asChild className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary/70 hover:shadow-md transition-all">
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Go to Home
                </Link>
              </Button>
            </motion.div>
            
            <motion.div 
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="w-full sm:w-auto"
            >
              <Button asChild variant="outline" className="w-full sm:w-auto border-primary/20 hover:border-primary/50 transition-colors">
                <Link href="javascript:history.back()">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Go Back
                </Link>
              </Button>
            </motion.div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
